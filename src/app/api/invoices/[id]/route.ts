import { Invoice } from '@/app/components/types/invoice'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (
          id,
          quantity,
          unit_price,
          total_price,
          product:products (
            name,
            description,
            category:categories (
              id,
              name
            )
          )
        ),
        request:requests (
          id,
          customer:users (
            id,
            name,
            email
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    // Fetch shipping address separately
    if (data?.request?.customer?.id) {
      const { data: addressData } = await supabase
        .from('shipping_address')
        .select('*')
        .eq('user_id', data.request.customer.id)
        .eq('is_default', true)
        .single()

      // Transform data with customer information
      const transformedData: Invoice = {
        id: data.id,
        request_id: data.request_id,
        user_id: data.user_id,
        status: data.status,
        amount: data.amount,
        due_date: data.due_date,
        created_at: data.created_at,
        updated_at: data.updated_at,
        pdf_url: data.pdf_url,
        invoice_items: data.invoice_items || [],
        request: {
          id: data.request?.id,
          customer: {
            name: data.request?.customer?.name || 'N/A',
            email: data.request?.customer?.email || 'N/A',
            shipping_address: addressData || undefined
          }
        }
      }

      return NextResponse.json(transformedData)
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from('invoices')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Error updating invoice' },
      { status: 500 }
    )
  }
} 