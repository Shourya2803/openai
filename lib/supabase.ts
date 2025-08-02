import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if we have valid environment variables
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          user_input: string
          ai_response: string
          processing_time: number
          created_at: string
        }
        Insert: {
          id?: string
          user_input: string
          ai_response: string
          processing_time: number
          created_at?: string
        }
        Update: {
          id?: string
          user_input?: string
          ai_response?: string
          processing_time?: number
          created_at?: string
        }
      }
    }
  }
}