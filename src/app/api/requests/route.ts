import { NextResponse } from 'next/server'
import { supabase } from '@/app/components/lib/supabase'
import { z } from 'zod'

// Validation schemas
const createRequestSchema = z.object({
  customer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().min(1),
  budget: z.number().min(0),
  status: z.enum(['pending', 'approved', 'rejected', 'fulfilled']).default('pending')
})

const updateRequestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'fulfilled']).optional(),
  quantity: z.number().min(1).optional(),
  budget: z.number().min(0).optional(),
  notes: z.string().optional(),
  updated_by: z.string().uuid()
})

// GET endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const customerId = searchParams.get('customerId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit
  
  try {
    let query = supabase
      .from('requests')
      .select(`
        *,
        customer:users(name, email),
        product:products(name, category),
        status_history(status, notes, created_at, updated_by)
      `, { count: 'exact' })
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (customerId) {
      query = query.eq('customer_id', customerId)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      data,
      total: count,
      page,
      pageCount: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Requests API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// POST endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createRequestSchema.parse(body)
    
    // Start a Supabase transaction
    const { data: request_data, error: request_error } = await supabase
      .from('requests')
      .insert(validatedData)
      .select(`
        *,
        customer:users(name, email),
        product:products(name, category)
      `)
      .single()
    
    if (request_error) throw request_error
    
    // Create initial status history entry
    const { error: history_error } = await supabase
      .from('status_history')
      .insert({
        request_id: request_data.id,
        status: 'pending',
        notes: 'Request created',
        updated_by: validatedData.customer_id
      })
    
    if (history_error) throw history_error
    
    return NextResponse.json(request_data)
  } catch (error) {
    console.error('Requests API Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}

// PUT endpoint
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const validatedData = updateRequestSchema.parse(body)
    const { id, updated_by, notes, ...updates } = validatedData
    
    // Start a Supabase transaction
    const { data: request_data, error: request_error } = await supabase
      .from('requests')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:users(name, email),
        product:products(name, category)
      `)
      .single()
    
    if (request_error) throw request_error
    
    // Add status history entry if status was updated
    if (updates.status) {
      const { error: history_error } = await supabase
        .from('status_history')
        .insert({
          request_id: id,
          status: updates.status,
          notes: notes || `Status updated to ${updates.status}`,
          updated_by
        })
      
      if (history_error) throw history_error
    }
    
    return NextResponse.json(request_data)
  } catch (error) {
    console.error('Requests API Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

// DELETE endpoint
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json(
      { error: 'Request ID is required' },
      { status: 400 }
    )
  }
  
  try {
    // Delete related records first
    await supabase
      .from('status_history')
      .delete()
      .eq('request_id', id)
    
    await supabase
      .from('supplier_responses')
      .delete()
      .eq('request_id', id)
    
    // Finally delete the request
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true,
      message: 'Request and related records deleted successfully'
    })
  } catch (error) {
    console.error('Requests API Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
}
