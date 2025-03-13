import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { paymentMethodId, userId } = await request.json();

    // First get user's email from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData?.email) {
      throw new Error('Could not find user email');
    }

    // Create or get existing Stripe customer
    let customer;
    const customers = await stripe.customers.list({
      email: userData.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          supabaseUserId: userId
        }
      });
    }

    // Attach the payment method
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({ success: true, paymentMethod });
  } catch (error) {
    console.error('Error saving card:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save card' },
      { status: 500 }
    );
  }
} 