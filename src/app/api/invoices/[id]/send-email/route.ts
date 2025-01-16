import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
// We'll need to implement email sending logic here
import { sendInvoiceEmail } from '@/app/components/lib/email'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (
          *,
          product:products (*)
        ),
        request:requests (
          *,
          customer:users (name, email)
        )
      `)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (error) throw error

    await sendInvoiceEmail(invoice)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending invoice email:', error)
    return NextResponse.json(
      { error: 'Error sending invoice email' },
      { status: 500 }
    )
  }
} 