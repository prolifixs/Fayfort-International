import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/app/components/lib/stripe/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { paymentMethodId } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get or create customer
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    const customer = customers.data[0] || await stripe.customers.create({
      email: session.user.email!,
      metadata: { supabaseUserId: session.user.id }
    });

    // Attach payment method
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    return NextResponse.json({ success: true, paymentMethod });
  } catch (error) {
    console.error('Error saving card:', error);
    return NextResponse.json({ error: 'Failed to save card' }, { status: 500 });
  }
} 