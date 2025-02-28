import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/app/components/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uxbakpeeqydatgvvdyaa.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) throw new Error('Missing Supabase URL')
if (!supabaseAnonKey) throw new Error('Missing Supabase Anon Key')

// Create single client instance for regular user operations
export const supabase = createClientComponentClient<Database>({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
  cookieOptions: {
    name: 'fayfort-auth',
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    domain: typeof window !== 'undefined' ? window.location.hostname : undefined
  }
})

// Create admin client with service role key for administrative operations
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceRoleKey) {
  throw new Error('Missing Supabase Service Role Key')
}

// Debug logging for admin operations
const debugAdmin = (operation: string, details?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔑 Admin Operation: ${operation}`, details || '');
  }
};

export const supabaseAdmin = new Proxy(createClient<Database>(
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
  get(target: any, prop: string | symbol) {
    const value = (target as any)[prop];
    if (typeof value === 'function') {
      return (...args: any[]) => {
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