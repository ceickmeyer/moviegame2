import { createClient } from '@supabase/supabase-js';
// For SvelteKit, use environment variables
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);