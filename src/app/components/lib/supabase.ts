import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uxbakpeeqydatgvvdyaa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YmFrcGVlcXlkYXRndnZkeWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MDg5MTcsImV4cCI6MjA1MTE4NDkxN30.9UOvUzpcsag8PtWMtfnaSbE5ln2h_FFE_gxbsCZz20A'

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL')
}
if (!supabaseKey) {
  throw new Error('Missing Supabase Anon Key')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true
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

// Debug logging
console.log('Supabase Client Initialized:', {
  url: supabaseUrl,
  keyLength: supabaseKey?.length
}) 