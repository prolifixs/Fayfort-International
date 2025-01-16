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

    const { data: links, error } = await supabase
      .from('social_media_links')
      .select('*')
      .eq('user_id', session.user.id)
      .order('platform', { ascending: true })

    if (error) throw error

    return NextResponse.json(links)
  } catch (error) {
    console.error('Error fetching social links:', error)
    return NextResponse.json(
      { error: 'Error fetching social links' },
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
      .from('social_media_links')
      .insert({ ...body, user_id: session.user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating social link:', error)
    return NextResponse.json(
      { error: 'Error creating social link' },
      { status: 500 }
    )
  }
} 