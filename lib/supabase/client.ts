import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('[v0] Supabase URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.log('[v0] Supabase Key:', supabaseKey ? 'SET' : 'MISSING')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[v0] Missing Supabase environment variables!')
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
