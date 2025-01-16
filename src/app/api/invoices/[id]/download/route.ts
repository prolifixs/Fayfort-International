import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { generatePDFKit } from '@/app/components/lib/pdf'

export async function GET(
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
        items:invoice_items (
          *,
          product:products (*)
        ),
        user:users (
          name,
          email,
          shipping_address:shipping_addresses!inner(*)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    const pdfBuffer = await generatePDFKit(invoice)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.id}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Error generating invoice PDF' },
      { status: 500 }
    )
  }
} 