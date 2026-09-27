import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  props: { params: Promise<{ productId: string }> }
) {
  const params = await props.params
  const supabase = await createSupabaseServerClient()

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
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Transform the data to include invoice_status
  const transformedRequests = requests.map(request => ({
    ...request,
    invoice_status: request.invoice?.status === 'paid' ? 'paid' : 'unpaid'
  }))

  return NextResponse.json(transformedRequests)
} 