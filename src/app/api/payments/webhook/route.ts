import { stripe } from '@/app/components/lib/stripe/server'
import { headers } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// New way to configure API routes in App Router
export const runtime = 'edge'; // optional
export const dynamic = 'force-dynamic';
export const preferredRegion = 'iad1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    const supabase = createRouteHandlerClient({ cookies })

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as { metadata: { invoice_id?: string } }
        if (paymentIntent.metadata.invoice_id) {
          await supabase
            .from('invoices')
            .update({ status: 'paid' })
            .eq('id', paymentIntent.metadata.invoice_id)
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as { metadata: { invoice_id?: string } }
        if (paymentIntent.metadata.invoice_id) {
          await supabase
            .from('invoices')
            .update({ status: 'failed' })
            .eq('id', paymentIntent.metadata.invoice_id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
} 