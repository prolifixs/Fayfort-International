import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the user's session/token from cookies
  const session = request.cookies.get('session');
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  // If trying to access admin routes without authentication
  if (isAdminPath && !session) {
    // Redirect to login page with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
  ],
}; 