import { NextResponse } from 'next/server';

export async function GET() {
  // Only enable in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Debug endpoint disabled in production' });
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    urls: {
      app_url: process.env.NEXT_PUBLIC_APP_URL,
      site_url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    stripe: {
      has_public_key: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      has_secret_key: !!process.env.STRIPE_SECRET_KEY,
      has_webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    supabase: {
      has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    email: {
      has_resend_key: !!process.env.RESEND_API_KEY,
    }
  });
} 