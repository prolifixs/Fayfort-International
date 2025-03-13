import { stripe } from '@/app/components/lib/stripe/server'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing stripe signature or webhook secret' },
      { status: 400 }
    )
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    const supabase = createRouteHandlerClient({ cookies })

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        const invoiceId = paymentIntent.metadata.invoice_id

        // Update invoice status
        await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', invoiceId)
        break

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object
        const failedInvoiceId = failedPaymentIntent.metadata.invoice_id

        // Update invoice status
        await supabase
          .from('invoices')
          .update({ status: 'failed' })
          .eq('id', failedInvoiceId)
        break
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

export const config = {
  api: {
    bodyParser: false,
  },
} 