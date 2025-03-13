import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/app/components/lib/stripe/server';

// Add route configurations
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Add type for request
interface CreateIntentRequest {
  invoice: {
    amount: number;
    id?: string;
  };
}

export async function POST(request: Request) {
  try {
    // Add error handling for JSON parsing
    const body = await request.json().catch(() => ({})) as CreateIntentRequest;
    const { invoice } = body;

    if (!invoice?.amount) {
      return NextResponse.json(
        { error: 'Missing required invoice amount' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user;
    
    // Create or get customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    const customer = customers.data[0] || await stripe.customers.create({
      email: user.email,
      metadata: { supabaseUserId: user.id }
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.amount * 100),
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        ...(invoice.id ? { invoiceId: invoice.id.toString() } : {}),
        userEmail: user.email?.toString() ?? null
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
} 