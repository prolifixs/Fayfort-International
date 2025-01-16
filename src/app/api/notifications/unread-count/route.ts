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

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('read_status', false)

    if (error) throw error

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: 'Error fetching unread count' },
      { status: 500 }
    )
  }
} 