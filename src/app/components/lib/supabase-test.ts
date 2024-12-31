import { supabase } from './supabase'

export async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase.from('products').select('*').limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Connection successful!')
    console.log('Sample data:', data)
    return true
  } catch (error) {
    console.error('❌ Connection error:', error)
    return false
  }
} 