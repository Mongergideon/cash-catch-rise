export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          id: string
          permissions: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_bonus: {
        Row: {
          amount: number
          claimed_at: string | null
          date: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          claimed_at?: string | null
          date?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          date?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_bonus_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_earnings: {
        Row: {
          bonus_earnings: number | null
          created_at: string | null
          date: string
          game_earnings: number | null
          id: string
          referral_earnings: number | null
          total_earned: number | null
          user_id: string
        }
        Insert: {
          bonus_earnings?: number | null
          created_at?: string | null
          date?: string
          game_earnings?: number | null
          id?: string
          referral_earnings?: number | null
          total_earned?: number | null
          user_id: string
        }
        Update: {
          bonus_earnings?: number | null
          created_at?: string | null
          date?: string
          game_earnings?: number | null
          id?: string
          referral_earnings?: number | null
          total_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_earnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_earnings: {
        Row: {
          amount: number
          created_at: string | null
          game_type: Database["public"]["Enums"]["game_type"]
          id: string
          session_duration: number | null
          taps_count: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          game_type: Database["public"]["Enums"]["game_type"]
          id?: string
          session_duration?: number | null
          taps_count?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          game_type?: Database["public"]["Enums"]["game_type"]
          id?: string
          session_duration?: number | null
          taps_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_earnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          can_withdraw: boolean
          cost: number
          created_at: string | null
          duration_days: number
          games_unlocked: number | null
          id: string
          is_active: boolean | null
          max_daily_earnings: number
          name: string
          type: Database["public"]["Enums"]["plan_type"]
          withdrawal_frequency: string | null
        }
        Insert: {
          can_withdraw: boolean
          cost: number
          created_at?: string | null
          duration_days: number
          games_unlocked?: number | null
          id?: string
          is_active?: boolean | null
          max_daily_earnings: number
          name: string
          type: Database["public"]["Enums"]["plan_type"]
          withdrawal_frequency?: string | null
        }
        Update: {
          can_withdraw?: boolean
          cost?: number
          created_at?: string | null
          duration_days?: number
          games_unlocked?: number | null
          id?: string
          is_active?: boolean | null
          max_daily_earnings?: number
          name?: string
          type?: Database["public"]["Enums"]["plan_type"]
          withdrawal_frequency?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          current_plan: Database["public"]["Enums"]["plan_type"] | null
          email: string | null
          first_name: string | null
          id: string
          is_banned: boolean | null
          last_name: string | null
          next_withdraw_at: string | null
          next_withdrawal_allowed_at: string | null
          phone: string | null
          plan_expires_at: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string | null
          wallet_earnings: number | null
          wallet_funding: number | null
        }
        Insert: {
          created_at?: string | null
          current_plan?: Database["public"]["Enums"]["plan_type"] | null
          email?: string | null
          first_name?: string | null
          id: string
          is_banned?: boolean | null
          last_name?: string | null
          next_withdraw_at?: string | null
          next_withdrawal_allowed_at?: string | null
          phone?: string | null
          plan_expires_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          wallet_earnings?: number | null
          wallet_funding?: number | null
        }
        Update: {
          created_at?: string | null
          current_plan?: Database["public"]["Enums"]["plan_type"] | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_banned?: boolean | null
          last_name?: string | null
          next_withdraw_at?: string | null
          next_withdrawal_allowed_at?: string | null
          phone?: string | null
          plan_expires_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          wallet_earnings?: number | null
          wallet_funding?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string
          referrer_id: string
          reward_amount: number | null
          reward_issued: boolean | null
          reward_issued_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          reward_amount?: number | null
          reward_issued?: boolean | null
          reward_issued_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number | null
          reward_issued?: boolean | null
          reward_issued_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_items: {
        Row: {
          cost: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
        }
        Insert: {
          cost: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      store_purchases: {
        Row: {
          cost: number
          created_at: string | null
          expires_at: string | null
          id: string
          item_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          cost: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          item_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          item_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          cost: number
          expires_at: string
          id: string
          is_active: boolean | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          started_at: string | null
          user_id: string
        }
        Insert: {
          cost: number
          expires_at: string
          id?: string
          is_active?: boolean | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          started_at?: string | null
          user_id: string
        }
        Update: {
          cost?: number
          expires_at?: string
          id?: string
          is_active?: boolean | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          account_name: string
          account_number: string
          admin_notes: string | null
          amount: number
          bank_name: string
          created_at: string | null
          fee: number
          id: string
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"] | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          admin_notes?: string | null
          amount: number
          bank_name: string
          created_at?: string | null
          fee?: number
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_notes?: string | null
          amount?: number
          bank_name?: string
          created_at?: string | null
          fee?: number
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_ban_user: {
        Args: { user_uuid: string; banned: boolean }
        Returns: boolean
      }
      admin_get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          wallet_earnings: number
          wallet_funding: number
          current_plan: string
          plan_expires_at: string
          is_banned: boolean
          created_at: string
          referral_code: string
        }[]
      }
      admin_get_user_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      admin_get_wallet_totals: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_earnings: number
          total_funding: number
        }[]
      }
      can_user_withdraw: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      update_next_withdrawal_time: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      update_wallet_balance: {
        Args: {
          user_uuid: string
          wallet_type: string
          amount: number
          transaction_description?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      game_type: "money_falling" | "coin_runner" | "spin_wheel" | "memory_flip"
      plan_type:
        | "free_trial"
        | "starter"
        | "bronze"
        | "silver"
        | "gold"
        | "platinum"
      transaction_type:
        | "wallet_fund"
        | "plan_purchase"
        | "store_purchase"
        | "game_earning"
        | "referral_earning"
        | "daily_bonus"
        | "withdrawal_fee"
      withdrawal_status: "pending" | "approved" | "rejected" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      game_type: ["money_falling", "coin_runner", "spin_wheel", "memory_flip"],
      plan_type: [
        "free_trial",
        "starter",
        "bronze",
        "silver",
        "gold",
        "platinum",
      ],
      transaction_type: [
        "wallet_fund",
        "plan_purchase",
        "store_purchase",
        "game_earning",
        "referral_earning",
        "daily_bonus",
        "withdrawal_fee",
      ],
      withdrawal_status: ["pending", "approved", "rejected", "completed"],
    },
  },
} as const
