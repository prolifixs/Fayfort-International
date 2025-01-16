import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const offset = (page - 1) * pageSize
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase
    .from('notifications')
    .select('*, count(*) OVER()', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (unreadOnly) {
    query = query.eq('read_status', false)
  }

  const { data, error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  })
}

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id, action } = await request.json()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'markAllRead') {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('user_id', user.id)
      .eq('read_status', false)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_status: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
} 