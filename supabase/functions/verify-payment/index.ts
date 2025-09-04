import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionReference } = await req.json();

    if (!transactionReference) {
      return new Response(
        JSON.stringify({ error: "Transaction reference is required" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Check if transaction has already been processed
    const { data: existingDeposit } = await supabaseClient
      .from('deposits')
      .select('*')
      .eq('transaction_reference', transactionReference)
      .eq('user_id', user.id)
      .single();

    if (existingDeposit && existingDeposit.status === 'completed') {
      return new Response(
        JSON.stringify({ 
          error: "Transaction has already been processed",
          transaction: existingDeposit
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify transaction using your payment API
    const paymentApiSecret = Deno.env.get("PAYMENT_API_SECRET");
    if (!paymentApiSecret) {
      console.error("PAYMENT_API_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Payment verification service not configured" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Call Flutterwave API to verify transaction
    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionReference}/verify`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paymentApiSecret}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verificationData = await verifyResponse.json();
    console.log("Payment verification response:", verificationData);

    if (!verifyResponse.ok || verificationData.status !== "success") {
      // Handle specific Flutterwave error messages
      if (verificationData.message === "No transaction was found for this id") {
        return new Response(
          JSON.stringify({ 
            error: "Transaction not found. Please check your transaction reference and try again.",
            details: "This transaction reference does not exist in our payment system."
          }), 
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Transaction verification failed",
          details: verificationData.message || "Invalid transaction"
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const transactionData = verificationData.data;

    // Check if payment was successful
    if (transactionData.status !== "successful") {
      return new Response(
        JSON.stringify({ 
          error: "Transaction was not successful",
          status: transactionData.status
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const amount = parseFloat(transactionData.amount);
    const currency = transactionData.currency || "NGN";

    // Use service role key for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Insert or update deposit record
    const { error: depositError } = await supabaseService
      .from('deposits')
      .upsert({
        user_id: user.id,
        amount: amount,
        currency: currency,
        transaction_reference: transactionReference,
        payment_method: transactionData.payment_type || 'flutterwave',
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          flw_ref: transactionData.flw_ref,
          tx_ref: transactionData.tx_ref,
          processor_response: transactionData.processor_response
        }
      }, {
        onConflict: 'transaction_reference,user_id'
      });

    if (depositError) {
      console.error("Error creating deposit record:", depositError);
      return new Response(
        JSON.stringify({ error: "Failed to record deposit" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Update user's wallet funding balance
    const { error: walletError } = await supabaseService
      .from('profiles')
      .update({
        wallet_funding: supabaseService.sql`wallet_funding + ${amount}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (walletError) {
      console.error("Error updating wallet:", walletError);
      return new Response(
        JSON.stringify({ error: "Failed to update wallet balance" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log the transaction
    const { error: transactionError } = await supabaseService
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'wallet_fund',
        amount: amount,
        description: `Wallet funding via ${transactionData.payment_type || 'payment'}`,
        reference_id: transactionReference,
        metadata: {
          payment_method: transactionData.payment_type,
          currency: currency,
          flw_ref: transactionData.flw_ref
        }
      });

    if (transactionError) {
      console.error("Error logging transaction:", transactionError);
    }

    // Create success notification
    await supabaseService.functions.invoke('create-user-action-notification', {
      body: {
        user_uuid: user.id,
        action_type: 'wallet_funding',
        action_details: {
          amount: amount.toString(),
          payment_method: transactionData.payment_type || 'payment'
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and wallet updated successfully",
        transaction: {
          reference: transactionReference,
          amount: amount,
          currency: currency,
          status: "completed",
          payment_method: transactionData.payment_type
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in verify-payment function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});