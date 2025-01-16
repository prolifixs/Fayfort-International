import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let query = supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (
          *,
          product:products (name, category)
        ),
        request:requests (
          *,
          customer:users (name, email)
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: invoices, error } = await query

    if (error) throw error

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Error fetching invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create invoices' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { request_id, items, ...invoiceData } = body

    // Start a transaction
    const { data, error } = await supabase.rpc('create_invoice', {
      p_request_id: request_id,
      p_invoice_data: invoiceData,
      p_items: items
    })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Error creating invoice' },
      { status: 500 }
    )
  }
} 