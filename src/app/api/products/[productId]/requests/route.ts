import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: requests, error } = await supabase
    .from('requests')
    .select(`
      *,
      user:users(id, email),
      invoice:invoices(id, status)
    `)
    .eq('product_id', params.productId)

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform the data to include invoice_status
  const transformedRequests = requests.map(request => ({
    ...request,
    invoice_status: request.invoice?.status === 'paid' ? 'paid' : 'unpaid'
  }))

  return NextResponse.json(transformedRequests)
} 