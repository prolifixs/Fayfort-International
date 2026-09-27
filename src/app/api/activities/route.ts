import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
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
    console.error('activities query failed:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('activities')
    .insert([body])
    .select()

  if (error) {
    console.error('activities query failed:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json(data[0])
} 