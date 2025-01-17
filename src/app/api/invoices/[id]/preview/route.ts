import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
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
            category
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

      const transformedData = {
        ...data,
        request: {
          ...data.request,
          customer: {
            ...data.request?.customer,
            shipping_address: addressData || undefined
          }
        }
      }

      return NextResponse.json(transformedData)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
} 