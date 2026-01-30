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

  console.log('[v0] Middleware check:', { pathname, hasUser: !!user })

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/403']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Protect dashboard (root /)
  if (pathname === '/' && !user) {
    console.log('[v0] Redirecting to login - no user')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if user tries to access login while authenticated
  if (pathname === '/login' && user) {
    console.log('[v0] User already logged in, redirecting to dashboard')
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Protect /memberview/* routes
  if (pathname.startsWith('/memberview')) {
    if (!user) {
      // Not authenticated - redirect to login with next param
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    // Fetch user profile for role and is_active check
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

    // Authorization check for /memberview/[id]
    const memberviewMatch = pathname.match(/^\/memberview\/([^\/]+)/)
    if (memberviewMatch) {
      const requestedId = memberviewMatch[1]
      
      // Avocat can access all /memberview/* pages
      if (profile.role === 'avocat') {
        return supabaseResponse
      }
      
      // Client can only access /memberview/[id] where id === auth.uid()
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
