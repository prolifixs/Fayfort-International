import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  
  const query = supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (type) {
    query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data, error } = await supabase
    .from('activities')
    .insert([body])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
} 