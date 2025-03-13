import { NextResponse } from 'next/server'
import { stripe } from '@/app/components/lib/stripe/server'

// Add route configurations
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface PaymentIntentRequest {
  amount: number;
  invoice_id: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as PaymentIntentRequest;
    const { amount, invoice_id } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        invoice_id: invoice_id?.toString() ?? null
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return NextResponse.json(
      { error: 'Payment intent creation failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Your GET logic if needed
} 