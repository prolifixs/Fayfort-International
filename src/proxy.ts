import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config'

// ENABLE_ENTERPRISE=true opens the enquiry path only: signing up and in, the catalog, and a
// customer's own requests. The rest of the enterprise app (admin pages, /request, invoices,
// profiles, and every /api route except email verification) stays closed with a 404 until its
// access-control issues are fixed (docs/SECURITY-REVIEW.md). FAYFORT answers enquiries in
// Fayfort Ops, not in this app.
const ENQUIRIES_OPEN = process.env.ENABLE_ENTERPRISE === 'true'

const PUBLIC_SITE_PATHS = ['/', '/services', '/about-us', '/terms', '/terms-ebooks', '/ebook/landed']

// Anyone may open these once enquiries are open: they are how people sign up and sign in.
const ENQUIRY_AUTH_PATHS = [
  '/login',
  '/register',
  '/check-email',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/unauthorized',
  '/auth/callback',
  '/api/auth/verify',
]

// These need a signed-in customer. Exact paths, so /dashboard doesn't also open /dashboard/invoices.
const ENQUIRY_ACCOUNT_PATHS = ['/catalog', '/dashboard', '/dashboard/requests', '/dashboard/notifications']
const ENQUIRY_ACCOUNT_PREFIXES = ['/catalog/', '/dashboard/requests/']

const isPublicSitePath = (pathname: string) =>
  PUBLIC_SITE_PATHS.includes(pathname) || pathname.startsWith('/ebook/landed/')

// Build output, public images, and single-segment files in /public (favicon, robots.txt).
const isStaticAsset = (pathname: string) =>
  pathname.startsWith('/_next/') || pathname.startsWith('/images/') || /^\/[^/]+\.[a-z0-9]+$/i.test(pathname)

const isAccountPath = (pathname: string) =>
  ENQUIRY_ACCOUNT_PATHS.includes(pathname) || ENQUIRY_ACCOUNT_PREFIXES.some((prefix) => pathname.startsWith(prefix))

const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function toLogin(req: NextRequest) {
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('redirectedFrom', req.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isPublicSitePath(pathname) || isStaticAsset(pathname)) return NextResponse.next()

  const authPage = ENQUIRIES_OPEN && ENQUIRY_AUTH_PATHS.includes(pathname)
  const accountPage = ENQUIRIES_OPEN && isAccountPath(pathname)
  // Rewriting to a path with no route renders the standard 404 page with a 404 status.
  if (!authPage && !accountPage) return NextResponse.rewrite(new URL('/__closed', req.url))

  // Without credentials (e.g. a local preview) nobody can be signed in.
  if (!hasSupabaseConfig) return accountPage ? toLogin(req) : NextResponse.next()

  // Refreshed auth cookies go on both the forwarded request and the response.
  let res = NextResponse.next({ request: req })
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

  try {
    // getUser() verifies the session with Supabase; getSession() would trust the cookie as-is.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && pathname === '/login') return NextResponse.redirect(new URL('/dashboard', req.url))
    if (accountPage && !user) return toLogin(req)
    return res
  } catch (error) {
    console.error('Proxy auth check failed:', error instanceof Error ? error.message : error)
    return accountPage ? toLogin(req) : res
  }
}

export const config = {
  // Everything except build output and the /public folders. Skipping by file extension instead
  // would let /api/products/media/x.png reach a dynamic API route without passing the gate above;
  // top-level files such as /robots.txt still come through here and pass as static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)'],
}
