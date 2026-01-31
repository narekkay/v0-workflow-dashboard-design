import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let supabaseInstance: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createBrowserClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseInstance = createSupabaseBrowserClient(supabaseUrl, supabaseKey)
  return supabaseInstance
}

// Legacy export for compatibility
export function createClient() {
  return createBrowserClient()
}
