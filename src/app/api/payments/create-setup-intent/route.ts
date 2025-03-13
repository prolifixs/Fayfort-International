import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Add logging to verify the key is loaded
console.log('Stripe key available:', !!process.env.STRIPE_SECRET_KEY);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'  // Match the version required by stripe v17.7.0
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getOrCreateCustomer(email: string, userId: string) {
  // First try to find existing customer
  const customers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer if none exists
  return await stripe.customers.create({
    email: email,
    metadata: {
      supabaseUserId: userId
    }
  });
}

export async function GET() {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Get user's email from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.email) {
      throw new Error('Could not find user email');
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(userData.email, user.id);

    // Create setup intent with logging
    console.log('Creating setup intent...');
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id, // Associate with customer
      payment_method_types: ['card'],
      usage: 'off_session',
    });
    
    console.log('Setup intent created:', {
      id: setupIntent.id,
      hasSecret: !!setupIntent.client_secret,
      customerId: customer.id
    });

    return NextResponse.json({ 
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId: customer.id // Return customer ID for reference
    });
  } catch (err) {
    console.error('Error creating setup intent:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create setup intent' },
      { status: 500 }
    );
  }
} 