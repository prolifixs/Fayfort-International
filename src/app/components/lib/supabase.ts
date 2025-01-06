import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uxbakpeeqydatgvvdyaa.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YmFrcGVlcXlkYXRndnZkeWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MDg5MTcsImV4cCI6MjA1MTE4NDkxN30.9UOvUzpcsag8PtWMtfnaSbE5ln2h_FFE_gxbsCZz20A'

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL')
}
if (!supabaseKey) {
  throw new Error('Missing Supabase Anon Key')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'fayfort-auth',
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'fayfortenterprise'
    }
  }
})

// Social auth configuration
export const socialAuthProviders = {
  google: {
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
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

// Debug logging only in development
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase Client Initialized:', {
    url: supabaseUrl,
    keyLength: supabaseKey?.length
  })
}

// Handle redirect URL separately in your auth functions
export const getRedirectUrl = () => {
  const redirectUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
  console.log('🔗 Generated redirect URL:', redirectUrl);
  return redirectUrl;
};