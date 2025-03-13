// Create a config file to centralize environment checks
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  const value = process.env[key] || defaultValue;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
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

// Define required vars based on environment
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

// Only validate in production, or if explicitly requested
if (process.env.NODE_ENV === 'production') {
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  });
}

export type Config = typeof config; 