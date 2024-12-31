import { useState, useEffect } from 'react'
import { supabase } from '@/app/components/lib/supabase'
import type { Database } from '@/app/components/types/database.types'
import { BaseOptions } from './types'

type User = Database['public']['Tables']['users']['Row']

interface UserOptions extends BaseOptions<User> {
  role?: 'admin' | 'customer' | 'supplier' | 'all'
  status?: 'active' | 'inactive' | 'all'
  search?: string
  disableRealtime?: boolean
}

export function useUsers(options: UserOptions = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (options.disableRealtime) return;

    const channel = supabase
      .channel('users_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUsers(current => [...current, payload.new as User])
          }
          if (payload.eventType === 'DELETE') {
            setUsers(current => current.filter(u => u.id !== payload.old.id))
          }
          if (payload.eventType === 'UPDATE') {
            setUsers(current =>
              current.map(u => u.id === payload.new.id ? payload.new as User : u)
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

    async function fetchUsers() {
      if (!mounted) return;
      setLoading(true);

      try {
        const { data, error, count } = await fetchUsersFromSupabase(options);
        if (!mounted) return;

        if (error) throw error;
        setUsers(data || []);
        if (count !== null) setTotal(count);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    fetchUsers();

    return () => {
      mounted = false;
    }
  }, [
    options.page,
    options.limit,
    options.search,
    options.role
  ])

  return { users, loading, error, total }
}

async function fetchUsersFromSupabase(options: UserOptions) {
  const {
    page = 1,
    limit = 10,
    search,
    role
  } = options;

  const offset = (page - 1) * limit;
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (role) {
    query = query.eq('role', role);
  }

  query = query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  return query;
} 