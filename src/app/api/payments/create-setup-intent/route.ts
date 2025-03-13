import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/app/components/lib/stripe/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

async function getOrCreateCustomer(email: string, userId: string) {
  const customers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  return customers.data[0] || await stripe.customers.create({
    email: email,
    metadata: { supabaseUserId: userId }
  });
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const customer = await getOrCreateCustomer(session.user.email!, session.user.id);

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    );
  }
} 