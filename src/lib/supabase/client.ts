import { createBrowserClient } from '@supabase/ssr'
import { AUTH_COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL } from './config'

// In the browser every call returns the same client, so all components share one session.
// Untyped for now: see the note in ./config.ts.
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookieOptions: AUTH_COOKIE_OPTIONS })
}
