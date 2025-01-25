import { useState, useEffect } from 'react'
import { supabase } from '@/app/components/lib/supabase'
import type { Database } from '@/app/components/types/database.types'
import { BaseOptions } from './types'

type Product = Database['public']['Tables']['products']['Row']

interface ProductOptions extends BaseOptions<Product> {
  search?: string
  category?: string
  availability?: boolean
  disableRealtime?: boolean
}

export function useProducts(options: ProductOptions = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Separate subscription setup from data fetching
  useEffect(() => {
    const channel = supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts(current => [...current, payload.new as Product])
          }
          if (payload.eventType === 'DELETE') {
            setProducts(current => current.filter(p => p.id !== payload.old.id))
          }
          if (payload.eventType === 'UPDATE') {
            setProducts(current => 
              current.map(p => p.id === payload.new.id ? payload.new as Product : p)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // Empty dependency array for subscription

  // Separate effect for fetching data
  useEffect(() => {
    let mounted = true;
    
    async function fetchProducts() {
      if (!mounted) return;
      setLoading(true);
      
      try {
        const { data, error, count } = await fetchProductsFromSupabase(options);
        if (!mounted) return;
        
        if (error) throw error;
        setProducts(data || []);
        if (count !== null) setTotal(count);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      mounted = false;
    }
  }, [
    options.page,
    options.limit,
    options.search,
    options.category,
    options.sort?.column,
    options.sort?.order,
    options.availability
  ]) // Only depend on specific options properties

  return { 
    products, 
    loading, 
    error,
    total,
    pageCount: Math.ceil(total / (options.limit || 10)),
    refresh: async () => {
      setLoading(true)
      const { data, error } = await supabase.from('products').select('*')
      if (error) setError(error.message)
      else setProducts(data)
      setLoading(false)
    }
  }
}

// Separate data fetching logic
async function fetchProductsFromSupabase(options: ProductOptions) {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    category, 
    sort,
    availability 
  } = options;
  
  const offset = (page - 1) * limit;
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (category && category !== 'all') {
    query = query.eq('category_id', category)
  }
  if (typeof availability === 'boolean') {
    query = query.eq('availability', availability)
  }

  if (sort) {
    query = query.order(sort.column, { ascending: sort.order === 'asc' })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  return query;
} 