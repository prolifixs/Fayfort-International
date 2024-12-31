import { NextResponse } from 'next/server'
import { supabase } from '@/app/components/lib/supabase'
import { z } from 'zod'

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['admin', 'customer', 'supplier']),
  status: z.enum(['active', 'inactive']).default('active')
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'customer', 'supplier']).optional(),
  status: z.enum(['active', 'inactive']).optional()
})

// GET endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const role = searchParams.get('role')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit
  
  try {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
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
    console.error('Users API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createUserSchema.parse(body)
    
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }
    
    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert(validatedData)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Users API Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PUT endpoint
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)
    const { id, ...updates } = validatedData
    
    // Check if email is being updated and already exists
    if (updates.email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', updates.email)
        .neq('id', id)
        .single()
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Users API Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
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
      { error: 'User ID is required' },
      { status: 400 }
    )
  }
  
  try {
    // Check for related requests
    const { data: requests } = await supabase
      .from('requests')
      .select('id')
      .eq('customer_id', id)
      .limit(1)
    
    if (requests?.length) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing requests' },
        { status: 400 }
      )
    }
    
    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Users API Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}