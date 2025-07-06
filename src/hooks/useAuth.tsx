
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData?: any) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle referral rewards when user signs up
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a new user by looking at their metadata
          const isNewUser = session.user.email_confirmed_at && 
            new Date(session.user.email_confirmed_at).getTime() > (Date.now() - 60000); // Within last minute
          
          if (isNewUser) {
            setTimeout(async () => {
              try {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('referred_by')
                  .eq('id', session.user.id)
                  .single();

                if (profileData?.referred_by) {
                  // Create referral record
                  await supabase
                    .from('referrals')
                    .insert({
                      referrer_id: profileData.referred_by,
                      referred_id: session.user.id,
                      reward_amount: 500.00
                    });
                }
              } catch (error) {
                console.error('Error handling referral:', error);
              }
            }, 1000);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    const redirectUrl = `https://blueridgecashgame.vercel.app/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
