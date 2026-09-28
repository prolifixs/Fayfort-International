import type { CookieOptionsWithName } from '@supabase/ssr'

// Fallbacks keep builds and the public site working without credentials; auth needs the real values.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uswsmbhkedbehkotxngm.supabase.co'
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-for-local-dev'

// The clients are untyped. The hand-written Database type in app/components/types/database.types.ts
// lacks the shape supabase-js expects (e.g. per-table Relationships), so passing it turns every query
// into `never`; the old auth-helpers silently fell back to untyped. Generate real types with
// `supabase gen types typescript` and pass them to createBrowserClient/createServerClient.

// Browser and server clients must use the same auth cookie, or the server never sees a browser login.
export const AUTH_COOKIE_OPTIONS: CookieOptionsWithName = {
  name: 'fayfort-auth',
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}
