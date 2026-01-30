import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('[v0] Missing Supabase environment variables')
    throw new Error('Missing Supabase configuration. Please configure Supabase integration.')
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseKey)
}

// Alias for compatibility with existing code
export const createBrowserClient = createClient
