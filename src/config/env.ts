// Create a config file to centralize environment checks
//
// Credentials are intentionally non-fatal for now — real backend wiring
// (Stripe/Supabase/Resend) is deferred to a later ERP/CRM pass. This never
// throws so a missing/placeholder credential can't take the whole build (or
// site) down; it just means the feature that needs it won't work yet.
const getEnvVar = (key: string, defaultValue: string = 'placeholder-not-configured'): string => {
  return process.env[key] || defaultValue;
};

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  isProduction,
  
  app: {
    url: getEnvVar('NEXT_PUBLIC_APP_URL'),
    environment: process.env.NODE_ENV || 'development'
  },
  
  stripe: {
    publicKey: getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    secretKey: isProduction 
      ? getEnvVar('STRIPE_LIVE_SECRET_KEY')
      : getEnvVar('STRIPE_SECRET_KEY'),
    webhookSecret: isProduction
      ? getEnvVar('STRIPE_LIVE_WEBHOOK_SECRET')
      : getEnvVar('STRIPE_WEBHOOK_SECRET'),
    apiVersion: '2025-02-24.acacia' as const
  },
  
  email: {
    from: isProduction 
      ? 'noreply@fayfort.com'
      : 'test@fayfort.com',
    testEmail: 'prolifixs.pj@gmail.com',
    resendKey: getEnvVar('RESEND_API_KEY')
  },

  supabase: {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRole: getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
  }
};

// Define required vars based on environment — kept as a reference list for
// whenever backend credentials are actually wired up; not enforced right now
// (see getEnvVar above).
const requiredVars = isProduction
  ? [
      'NEXT_PUBLIC_APP_URL',
      'STRIPE_LIVE_SECRET_KEY',
      'STRIPE_LIVE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]
  : [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

if (process.env.NODE_ENV === 'production') {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    console.warn(`Missing environment variables (features using them won't work yet): ${missing.join(', ')}`);
  }
}

export type Config = typeof config; 