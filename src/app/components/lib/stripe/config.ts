import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublicKey && process.env.NODE_ENV === 'production') {
  console.warn('Missing Stripe publishable key — payment features will not work until this is configured.');
}

export const getStripe = () => {
  return loadStripe(stripePublicKey || '');
}; 