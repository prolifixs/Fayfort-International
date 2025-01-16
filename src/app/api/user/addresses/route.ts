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

    const { data: addresses, error } = await supabase
      .from('shipping_address')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })

    if (error) throw error

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Error fetching addresses' },
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

    const body = await request.json()
    const { data, error } = await supabase
      .from('shipping_address')
      .insert({ ...body, user_id: session.user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: 'Error creating address' },
      { status: 500 }
    )
  }
} 