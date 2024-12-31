import { NextResponse } from 'next/server'
import { supabase } from '@/app/components/lib/supabase'
import { z } from 'zod'

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional()
})

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(50).optional(),
  description: z.string().optional()
})

// GET endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit
  
  try {
    let query = supabase
      .from('categories')
      .select('*', { count: 'exact' })  // Removed products count
    
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    
    query = query
      .order('name', { ascending: true })
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
    console.error('Categories API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = createCategorySchema.parse(body)
    
    // Check if category name already exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', validatedData.name)
      .single()
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }
    
    // Create new category
    const { data, error } = await supabase
      .from('categories')
      .insert(validatedData)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Categories API Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

// PUT endpoint
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)
    const { id, ...updates } = validatedData
    
    // Check if name is being updated and already exists
    if (updates.name) {
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', updates.name)
        .neq('id', id)
        .single()
      
      if (existingCategory) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 400 }
        )
      }
    }
    
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Categories API Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update category' },
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
      { error: 'Category ID is required' },
      { status: 400 }
    )
  }
  
  try {
    // Check for related products
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('category', id)
      .limit(1)
    
    if (products?.length) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing products' },
        { status: 400 }
      )
    }
    
    // Delete category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Categories API Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
} 