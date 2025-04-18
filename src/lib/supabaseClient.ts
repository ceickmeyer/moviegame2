import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private'

// Create a Supabase client with optimized configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false // Don't persist auth session as we don't need it for this app
  },
  global: {
    fetch: fetch.bind(globalThis), // Use the global fetch for better performance
    headers: {
      'x-application-name': 'movie-game' // Add custom header for tracking
    }
  }
})