import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Redirect to dashboard if already logged in and trying to access login
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Protect /dashboard/* routes
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      // Not authenticated - redirect to login with next param
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    // For /dashboard/memberview/[id] routes, check authorization
    const memberviewMatch = pathname.match(/^\/dashboard\/memberview\/([^\/]+)/)
    if (memberviewMatch) {
      // Fetch user profile for role check
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.is_active) {
        // No profile or inactive - sign out and redirect to login
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.delete('next')
        return NextResponse.redirect(url)
      }

      const requestedId = memberviewMatch[1]
      
      // Avocat can access all /dashboard/memberview/* pages
      if (profile.role === 'avocat') {
        return supabaseResponse
      }
      
      // Client can only access /dashboard/memberview/[id] where id === auth.uid()
      if (profile.role === 'client' && requestedId !== user.id) {
        // Deny access - redirect to 403
        const url = request.nextUrl.clone()
        url.pathname = '/403'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
