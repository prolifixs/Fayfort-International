import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const debugMiddleware = (message: string, data?: any) => {
    console.log(`🛡️ Middleware: ${message}`, data || '');
  };

  try {
    debugMiddleware('Checking session', { path: req.nextUrl.pathname });
    const { data: { session } } = await supabase.auth.getSession();
    debugMiddleware('Session status', { 
      hasSession: !!session,
      user: session?.user?.id,
      role: session?.user?.user_metadata?.role 
    });

    // If we're already on the login page and have a session, redirect to dashboard
    if (session && req.nextUrl.pathname === '/login') {
      const redirectTo = session.user.user_metadata?.role === 'admin' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    // Define public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/reset-password',
      '/auth/callback',
      '/check-email',
      '/verify-email'
    ]
    const isPublicRoute = publicRoutes.some(route => 
      req.nextUrl.pathname === route || 
      req.nextUrl.pathname.startsWith('/api/auth/')
    )

    // Always allow static files and public routes
    if (
      isPublicRoute || 
      req.nextUrl.pathname.startsWith('/_next') || 
      req.nextUrl.pathname.includes('.')
    ) {
      return res
    }

    // If no session and not a public route, redirect to login
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Handle admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const userRole = session.user.user_metadata?.role
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Set user info in request header for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      res.headers.set('x-user-id', session.user.id)
      res.headers.set('x-user-role', session.user.user_metadata?.role || 'customer')
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