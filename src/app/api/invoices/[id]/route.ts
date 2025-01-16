import { InvoiceWithItems } from '@/app/components/types/invoice';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface InvoiceItemResponse {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
    description: string;
  }
}

// Add type for API response
interface SupabaseInvoiceResponse {
  id: string;
  user: {
    name: string;
    email: string;
  };
  items: InvoiceItemResponse[];
  [key: string]: any;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    console.log('Fetching invoice:', params.id);
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items (
          id,
          quantity,
          unit_price,
          total_price,
          product:products (name, description)
        ),
        request:requests (
          id,
          customer:users (
            name,
            email
          )
        )
      `)
      .eq('id', params.id)
      .single()

    console.log('Raw response:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    if (!data) {
      console.error('No data found for invoice:', params.id);
      throw new Error('Invoice not found');
    }

    const transformedData = {
      id: data.id,
      request_id: data.request_id,
      user_id: data.user_id,
      status: data.status,
      amount: data.amount,
      due_date: data.due_date,
      created_at: data.created_at,
      updated_at: data.updated_at,
      pdf_url: data.pdf_url,
      customer_name: data.request?.customer?.name || '',
      customer_email: data.request?.customer?.email || '',
      items: (data.items || []).map((item: InvoiceItemResponse) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        product: {
          name: item.product?.name || '',
          description: item.product?.description || ''
        }
      }))
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error fetching invoice' },
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