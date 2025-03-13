import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublicKey) {
  throw new Error('Missing Stripe publishable key');
}

export const getStripe = () => {
  return loadStripe(stripePublicKey);
}; 