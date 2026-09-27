import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from('shipping_address')
      .update(body)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: 'Error updating address' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('shipping_address')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Error deleting address' },
      { status: 500 }
    )
  }
} 