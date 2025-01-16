import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('user_id', session.user.id)
      .eq('read_status', false)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all as read:', error)
    return NextResponse.json(
      { error: 'Error marking all as read' },
      { status: 500 }
    )
  }
} 