import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const requestSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(1),
  budget: z.number().min(0),
  notes: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'fulfilled']).default('pending')
})

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('requests')
      .select(`
        *,
        product:products (
          name,
          category,
          image_url
        ),
        customer:users (
          name,
          email
        ),
        status_history (
          id,
          status,
          notes,
          created_at,
          updated_by (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (searchParams.get('status')) {
      query = query.eq('status', searchParams.get('status'))
    }
    
    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Request API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    const { data, error } = await supabase
      .from('requests')
      .insert({
        ...validatedData,
        customer_id: session.user.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Request API Error:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
