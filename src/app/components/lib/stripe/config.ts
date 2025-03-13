import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublicKey && process.env.NODE_ENV === 'production') {
  throw new Error('Missing Stripe publishable key');
}

export const getStripe = () => {
  return loadStripe(stripePublicKey || '');
}; 