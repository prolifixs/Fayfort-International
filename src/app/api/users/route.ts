import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/components/lib/supabase'
import { z } from 'zod'

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['admin', 'customer', 'supplier']),
  status: z.enum(['active', 'inactive', 'pending']).default('pending')
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'customer', 'supplier']).optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional()
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
    let query = supabaseAdmin
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
    const validatedData = createUserSchema.parse(body)
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([validatedData])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PATCH endpoint
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single()
    
    if (error) throw error
    
    // If role is being updated, also update auth metadata
    if (validatedData.role) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        validatedData.id,
        { user_metadata: { role: validatedData.role } }
      )
      
      if (authError) throw authError
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}