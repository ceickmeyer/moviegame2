import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

// Create the Supabase client with options for better data type handling
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-typesafe': 'true' }, // This helps with automatic type conversion
  },
})

// Helper function to parse JSONB arrays if needed as fallback
export function parseJsonbArray(value: any): string[] {
  if (!value) return [];
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing JSONB field:', e);
      return [];
    }
  }
  
  return Array.isArray(value) ? value : [];
}