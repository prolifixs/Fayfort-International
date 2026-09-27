import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config'

// The enterprise app (login, dashboard, admin, /api) is closed in production until its
// access-control issues are fixed (docs/SECURITY-REVIEW.md). Set ENABLE_ENTERPRISE=true
// to reopen it; until then only the public site is served.
const ENTERPRISE_ENABLED = process.env.ENABLE_ENTERPRISE === 'true'
const PUBLIC_SITE_PATHS = ['/', '/services', '/about-us', '/terms', '/terms-ebooks', '/ebook/landed']

const isPublicSitePath = (pathname: string) =>
  PUBLIC_SITE_PATHS.includes(pathname) || pathname.startsWith('/ebook/landed/')

// Build output, public images, and single-segment files in /public (favicon, robots.txt).
const isStaticAsset = (pathname: string) =>
  pathname.startsWith('/_next/') || pathname.startsWith('/images/') || /^\/[^/]+\.[a-z0-9]+$/i.test(pathname)

export async function proxy(req: NextRequest) {
  if (!ENTERPRISE_ENABLED) {
    const { pathname } = req.nextUrl
    if (isPublicSitePath(pathname) || isStaticAsset(pathname)) return NextResponse.next()
    // Rewriting to a path with no route renders the standard 404 page with a 404 status.
    return NextResponse.rewrite(new URL('/__closed', req.url))
  }

  let res = NextResponse.next({ request: req })

  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/reset-password',
    '/auth/callback',
    '/check-email',
    '/verify-email',
    '/ebook/landed',
    '/products/fay',
    '/services',
    '/about-us',
    '/terms',
    '/terms-ebooks'
  ]
  const isPublicRoute = publicRoutes.some(route =>
    req.nextUrl.pathname === route ||
    req.nextUrl.pathname.startsWith('/ebook/landed/') ||
    req.nextUrl.pathname.startsWith('/products/fay/') ||
    req.nextUrl.pathname.startsWith('/api/auth/')
  )

  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // Public pages can be previewed locally without application credentials.
  // Protected pages remain protected and route to login until configured.
  if (!hasSupabaseConfig) {
    if (isPublicRoute) return res

    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Refreshed auth cookies go on both the forwarded request and the response.
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  const debugMiddleware = (message: string, data?: unknown) => {
    console.log(`🛡️ Middleware: ${message}`, data || '');
  };

  try {
    debugMiddleware('Checking session', { path: req.nextUrl.pathname });
    // getUser() verifies the session with Supabase; getSession() would trust the cookie as-is.
    const { data: { user } } = await supabase.auth.getUser();
    debugMiddleware('Session status', {
      hasSession: !!user,
      user: user?.id,
      role: user?.user_metadata?.role
    });

    // If we're already on the login page and have a session, redirect to dashboard
    if (user && req.nextUrl.pathname === '/login') {
      const redirectTo = user.user_metadata?.role === 'admin' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    // Always allow static files and public routes
    if (
      isPublicRoute || 
      req.nextUrl.pathname.startsWith('/_next') || 
      req.nextUrl.pathname.includes('.')
    ) {
      return res
    }

    // If no session and not a public route, redirect to login
    if (!user) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Handle admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const userRole = user.user_metadata?.role;
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Set user info in request header for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      res.headers.set('x-user-id', user.id)
      res.headers.set('x-user-role', user.user_metadata?.role || 'customer')
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login for safety
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
