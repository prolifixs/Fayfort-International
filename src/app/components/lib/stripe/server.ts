import Stripe from 'stripe';
import { config } from '@/config/env';

// Use test key in development, live key in production
const stripeSecretKey = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_LIVE_SECRET_KEY
  : (process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development');

export const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
}); 