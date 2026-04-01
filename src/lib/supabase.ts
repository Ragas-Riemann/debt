import { createClient } from '@supabase/supabase-js'

// ✅ ENV VARIABLES
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ✅ CREATE CLIENT WITH AUTH FIX
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // 🔥 VERY IMPORTANT
    autoRefreshToken: true,    // 🔥 keeps user logged in
    detectSessionInUrl: true,  // 🔥 handles redirects
  },
})

// ✅ TYPES (KEEP YOUR TYPES)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          email?: string
          created_at?: string
        }
      }
      debtors: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          name: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          debtor_id: string
          amount: number
          description: string | null
          created_at: string
        }
        Insert: {
          debtor_id: string
          amount: number
          description?: string | null
          created_at?: string
        }
        Update: {
          debtor_id?: string
          amount?: number
          description?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          debt_id: string
          amount_paid: number
          created_at: string
        }
        Insert: {
          debt_id: string
          amount_paid: number
          created_at?: string
        }
        Update: {
          debt_id?: string
          amount_paid?: number
          created_at?: string
        }
      }
    }
    Views: {
      debtor_summary: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
          total_debt: number
          remaining_balance: number
          total_paid: number
        }
      }
    }
  }
}