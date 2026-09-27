import { createClient } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { SUPABASE_ANON_KEY as supabaseAnonKey, SUPABASE_URL as supabaseUrl } from '@/lib/supabase/config'

// Create single client instance for regular user operations
export const supabase = createSupabaseBrowserClient()

// Create admin client with service role key for administrative operations
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key-for-local-dev'
if (!serviceRoleKey) {
  throw new Error('Missing Supabase Service Role Key')
}

// Debug logging for admin operations
const debugAdmin = (operation: string, details?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔑 Admin Operation: ${operation}`, details || '');
  }
};

// Untyped for the same reason as the clients in src/lib/supabase (see config.ts there).
export const supabaseAdmin = new Proxy(createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      debug: process.env.NODE_ENV === 'development'
    }
  }
), {
  get(target, prop) {
    const value = Reflect.get(target, prop);
    if (typeof value === 'function') {
      return (...args: unknown[]) => {
        debugAdmin(`Calling ${String(prop)}`, { args });
        return value.apply(target, args);
      };
    }
    return value;
  }
});

// Social auth configuration
export const socialAuthProviders = {
  google: {
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  },
  facebook: {
    provider: 'facebook',
    options: {
      queryParams: {
        display: 'popup'
      }
    }
  }
} as const

// Helper function to get the appropriate client based on admin status
export const getSupabaseClient = (isAdmin: boolean = false) => {
  return isAdmin ? supabaseAdmin : supabase
}

// Handle redirect URL for auth
export const getRedirectUrl = () => {
  const redirectUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 Generated redirect URL:', redirectUrl)
  }
  return redirectUrl
}

// Debug logging only in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 Supabase Clients Initialized:', {
    url: supabaseUrl,
    anonKeyLength: supabaseAnonKey?.length,
    serviceKeyLength: serviceRoleKey?.length
  })
}