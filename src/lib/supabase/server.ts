import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_OPTIONS, SUPABASE_ANON_KEY, SUPABASE_URL } from './config'

// For Route Handlers, Server Actions and Server Components. Untyped for now: see the note in ./config.ts.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components can't set cookies; the proxy refreshes the session on the next request.
        }
      },
    },
  })
}
