import Stripe from 'stripe';

if (typeof window !== 'undefined') {
  console.log('Environment Variables Check:', {
    hasPublicKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    environment: process.env.NODE_ENV
  });
}

// Use the public key for client-side operations
export const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
  apiVersion: '2025-02-24.acacia'
}); 