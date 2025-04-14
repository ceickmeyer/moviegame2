import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private'

// For local development with environment variables
let supabaseUrl = SUPABASE_URL;
let supabaseAnonKey = SUPABASE_ANON_KEY;

// For Vercel deployment
if (process.env.VERCEL) {
  supabaseUrl = process.env.PUBLIC_SUPABASE_URL || SUPABASE_URL;
  supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)