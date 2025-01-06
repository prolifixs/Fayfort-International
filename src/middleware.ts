import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    const { data: { session } } = await supabase.auth.getSession();

    // Define public routes
    const publicRoutes = ['/', '/login', '/register', '/reset-password', '/auth/callback', '/check-email'];
    const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

    // Allow public routes and static files
    if (isPublicRoute || 
        req.nextUrl.pathname.startsWith('/_next') || 
        req.nextUrl.pathname.startsWith('/api')) {
      return res;
    }

    // Redirect to login if no session on protected routes
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};