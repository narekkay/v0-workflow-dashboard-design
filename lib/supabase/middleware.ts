import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const startTime = Date.now()
  console.log('[v0] Middleware: Starting for path:', request.nextUrl.pathname)
  
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

  const authStart = Date.now()
  // Refresh session to prevent auto-logout
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.log('[v0] Middleware: getUser took', Date.now() - authStart, 'ms')

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/logout', '/403']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Redirect to dashboard if already logged in and trying to access login
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Protected routes - require authentication
  const protectedRoutes = ['/dashboard', '/onboarding', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    // Not authenticated - redirect to login with next param
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and on a protected route, check profile
  if (user && isProtectedRoute) {
    const profileStart = Date.now()
    // Fetch user profile for role check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle()
    console.log('[v0] Middleware: profile query took', Date.now() - profileStart, 'ms')

    if (profileError) {
      console.error('[v0] Error fetching profile:', profileError)
      // Allow access on error to avoid blocking authenticated users
      return supabaseResponse
    }

    if (!profile || !profile.is_active) {
      // No profile or inactive - sign out and redirect to login
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.delete('next')
      return NextResponse.redirect(url)
    }

    // Check authorization for specific routes
    // For /dashboard/memberview/[id] routes, check authorization
    const memberviewMatch = pathname.match(/^\/dashboard\/memberview\/([^\/]+)/)
    if (memberviewMatch) {
      const requestedId = memberviewMatch[1]
      
      // Avocat can access all /dashboard/memberview/* pages without re-authentication
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

    // Check onboarding routes
    const onboardingMatch = pathname.match(/^\/onboarding\/([^\/]+)/)
    if (onboardingMatch) {
      const requestedId = onboardingMatch[1]
      
      // Avocat can access all /onboarding/* pages
      if (profile.role === 'avocat') {
        return supabaseResponse
      }
      
      // Client can only access /onboarding/[id] where id === auth.uid()
      if (profile.role === 'client' && requestedId !== user.id) {
        // Deny access - redirect to 403
        const url = request.nextUrl.clone()
        url.pathname = '/403'
        return NextResponse.redirect(url)
      }
    }
  }

  console.log('[v0] Middleware: Total time', Date.now() - startTime, 'ms')
  return supabaseResponse
}
