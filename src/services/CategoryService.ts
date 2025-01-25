import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database, TableRow } from '@/app/components/types/database.types'

type Category = TableRow<'categories'>

export class CategoryService {
  private supabase = createClientComponentClient<Database>()

  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
} 