import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { stripe } from '@/app/components/lib/stripe/server'

export async function POST(request: Request) {
  try {
    const { paymentIntentId, invoiceId } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })

    // Verify payment intent status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment has not been completed')
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'paid',
        status_updated_at: new Date().toISOString(),
        payment_intent_id: paymentIntentId
      })
      .eq('id', invoiceId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment confirmation failed:', error)
    return NextResponse.json(
      { error: 'Payment confirmation failed' },
      { status: 500 }
    )
  }
} 