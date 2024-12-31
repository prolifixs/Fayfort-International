import { supabase } from '@/app/components/lib/supabase'

export async function cleanupDatabase() {
  // Delete test data in reverse order of dependencies
  await supabase.from('status_history').delete().neq('id', '')
  await supabase.from('supplier_responses').delete().neq('id', '')
  await supabase.from('requests').delete().neq('id', '')
  await supabase.from('products').delete().neq('id', '')
  await supabase.from('categories').delete().neq('id', '')
  await supabase.from('users').delete().neq('id', '')
}

export async function createTestUser() {
  const { data: user } = await supabase
    .from('users')
    .insert({
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer',
      status: 'active'
    })
    .select()
    .single()
  
  return user
}

export async function createTestCategory() {
  const { data: category } = await supabase
    .from('categories')
    .insert({
      name: 'Test Category',
      description: 'Test Description'
    })
    .select()
    .single()
  
  return category
} 

// Add these functions to the existing testUtils.ts

export async function createTestProduct() {
  const { data: product } = await supabase
    .from('products')
    .insert({
      name: 'Test Product',
      description: 'Test Description',
      category: 'Test Category',
      price_range: '$100-$200',
      availability: true
    })
    .select()
    .single()
  
  return product
}

export async function createTestRequest(overrides = {}) {
  const customer = await createTestUser()
  const product = await createTestProduct()

  const { data: request } = await supabase
    .from('requests')
    .insert({
      customer_id: customer.id,
      product_id: product.id,
      quantity: 1,
      budget: 100,
      status: 'pending',
      ...overrides
    })
    .select(`
      *,
      customer:users(name, email),
      product:products(name, category)
    `)
    .single()
  
  return request
}