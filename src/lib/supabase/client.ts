import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('[Supabase Debug]', { supabaseUrl, supabaseAnonKey });
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing! Check .env.local and restart the dev server.');
}

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
} 