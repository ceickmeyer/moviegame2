import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/dynamic/private'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

