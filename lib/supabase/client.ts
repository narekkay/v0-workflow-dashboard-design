import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[v0] Missing Supabase environment variables!')
    throw new Error('Supabase configuration is missing. Please check your environment variables.')
  }
  
  const client = createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
  })

  // Log helpful debugging info
  if (typeof window !== 'undefined') {
    console.log('[v0] Supabase client initialized')
    console.log('[v0] Project URL:', supabaseUrl)
    console.log('[v0] Preview domain:', window.location.origin)
    console.log('[v0] IMPORTANT: Add this URL to Supabase Auth settings:')
    console.log(`[v0] ${window.location.origin}/**`)
  }

  return client
}
