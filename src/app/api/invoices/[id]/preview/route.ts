import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const supabase = await createSupabaseServerClient()

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
            id,
            name,
            description,
            category_id
          )
        ),
        request:requests (
          id,
          customer:users (
            id,
            email,
            name
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