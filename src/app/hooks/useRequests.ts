import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/app/components/lib/supabase'
import debounce from 'lodash/debounce'
import type { Request } from '@/app/components/types'

interface RequestOptions {
  limit?: number
  page?: number
  search?: string
  status?: string
  userId?: string
  disableRealtime?: boolean
}

interface RequestsHookReturn {
  requests: Request[];
  loading: boolean;
  error: string | null;
  total: number;
  refresh: () => Promise<void>;
}

export function useRequests(options: RequestOptions = {}): RequestsHookReturn {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Use useRef to persist the debounced function
  const debouncedFetchRef = useRef(
    debounce(async (opts: RequestOptions) => {
      setLoading(true);
      try {
        const { data, error, count } = await fetchRequestsFromSupabase(opts);
        if (error) throw error;
        setRequests(data || []);
        if (count !== null) setTotal(count);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }, 1000)
  ).current;

  // Fetch data when options change
  useEffect(() => {
    debouncedFetchRef(options);
    
    return () => {
      debouncedFetchRef.cancel();
    };
  }, [
    options.page,
    options.limit,
    options.search,
    options.status,
    options.userId,
    debouncedFetchRef
  ]);

  // Manual refresh without debounce
  const refresh = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await fetchRequestsFromSupabase(options);
      if (error) throw error;
      setRequests(data || []);
      if (count !== null) setTotal(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { requests, loading, error, total, refresh };
}

async function fetchRequestsFromSupabase(options: RequestOptions) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    userId
  } = options;

  const offset = (page - 1) * limit;
  let query = supabase
    .from('requests')
    .select('*, user:users(name), product:products(name)', { count: 'exact' });

  if (search) {
    query = query.or(`product.name.ilike.%${search}%,user.name.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  query = query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  return query;
} 