// Create a config file to centralize environment checks
const getEnvVar = (key: string, defaultValue: string = ''): string => {
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
    publicKey: getEnvVar(
      isProduction ? 'STRIPE_LIVE_PUBLIC_KEY' : 'STRIPE_TEST_PUBLIC_KEY'
    ),
    secretKey: getEnvVar(
      isProduction ? 'STRIPE_LIVE_SECRET_KEY' : 'STRIPE_TEST_SECRET_KEY'
    ),
    webhookSecret: getEnvVar(
      isProduction ? 'STRIPE_LIVE_WEBHOOK_SECRET' : 'STRIPE_TEST_WEBHOOK_SECRET'
    ),
    apiVersion: '2025-02-24.acacia' as const
  },
  
  email: {
    from: isProduction 
      ? 'noreply@fayfort.com'
      : 'test@fayfort.com',
    testEmail: 'prolifixs.pj@gmail.com',
    resendKey: getEnvVar(
      isProduction ? 'RESEND_LIVE_API_KEY' : 'RESEND_TEST_API_KEY'
    )
  },

  supabase: {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRole: getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
  }
};

// Validate required environment variables
const requiredVars = [
  'NEXT_PUBLIC_APP_URL',
  isProduction ? 'STRIPE_LIVE_SECRET_KEY' : 'STRIPE_TEST_SECRET_KEY',
  isProduction ? 'STRIPE_LIVE_WEBHOOK_SECRET' : 'STRIPE_TEST_WEBHOOK_SECRET',
  isProduction ? 'RESEND_LIVE_API_KEY' : 'RESEND_TEST_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

export type Config = typeof config; 