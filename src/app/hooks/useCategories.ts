import { useState, useEffect } from 'react'
import { supabase } from '@/app/components/lib/supabase'

interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface CategoryOptions {
  limit?: number;
  page?: number;
  search?: string;
  disableRealtime?: boolean;
}

export function useCategories(options: CategoryOptions = {}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Subscription setup
  useEffect(() => {
    if (options.disableRealtime) return;

    const channel = supabase
      .channel('categories_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCategories(current => [...current, payload.new as Category])
          }
          if (payload.eventType === 'DELETE') {
            setCategories(current => current.filter(c => c.id !== payload.old.id))
          }
          if (payload.eventType === 'UPDATE') {
            setCategories(current =>
              current.map(c => c.id === payload.new.id ? payload.new as Category : c)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [options.disableRealtime])

  // Data fetching
  useEffect(() => {
    let mounted = true;

    async function fetchCategories() {
      if (!mounted) return;
      setLoading(true);

      try {
        const { data, error, count } = await fetchCategoriesFromSupabase(options);
        if (!mounted) return;

        if (error) throw error;
        setCategories(data || []);
        if (count !== null) setTotal(count);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchCategories();

    return () => {
      mounted = false;
    }
  }, [
    options.page,
    options.limit,
    options.search
  ])

  return { categories, loading, error, total }
}

async function fetchCategoriesFromSupabase(options: CategoryOptions) {
  const {
    page = 1,
    limit = 10,
    search
  } = options;

  const offset = (page - 1) * limit;
  let query = supabase
    .from('categories')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query
    .range(offset, offset + limit - 1)
    .order('name', { ascending: true });

  return query;
} 