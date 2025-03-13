import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { stripe } from '@/app/components/lib/stripe/server'

// Add these export configurations
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

// Add type for the request
interface ConfirmPaymentRequest {
  paymentIntentId: string
  invoiceId: string
}

export async function POST(request: Request) {
  try {
    // Add error handling for JSON parsing
    const body = await request.json().catch(() => ({})) as ConfirmPaymentRequest
    const { paymentIntentId, invoiceId } = body

    if (!paymentIntentId || !invoiceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Verify payment intent status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment has not been completed' },
        { status: 400 }
      )
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

    if (updateError) {
      console.error('Database update failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment confirmation failed:', error)
    return NextResponse.json(
      { error: 'Payment confirmation failed' },
      { status: 500 }
    )
  }
}

// Add OPTIONS handler for CORS if needed
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
  )
} 