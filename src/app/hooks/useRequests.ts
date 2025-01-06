'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../components/lib/supabase'

export interface Request {
  id: string
  customer_id: string
  product_id: string
  quantity: number
  budget: number
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled'
  created_at: string
  updated_at: string
  product: {
    name: string
    category: string
  }
  customer: {
    name: string
    email: string
  }
  status_history: {
    id: string
    status: string
    notes: string
    created_at: string
    updated_by: {
      name: string
    }
  }[]
}

interface UseRequestsOptions {
  status?: string
  startDate?: string
  endDate?: string
}

export function useRequests(options: UseRequestsOptions = {}) {
  const [requests, setRequests] = useState<Request[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize options to prevent infinite loops
  const memoizedOptions = useMemo(() => ({
    status: options.status,
    startDate: options.startDate,
    endDate: options.endDate
  }), [options.status, options.startDate, options.endDate])

  useEffect(() => {
    fetchRequests()
  }, [memoizedOptions]) // Use memoized options instead

  const fetchRequests = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('requests')
        .select(`
          *,
          product:products(name, category),
          customer:users(name, email),
          status_history(
            id,
            status,
            notes,
            created_at,
            updated_by:users(name)
          )
        `)
        .order('created_at', { ascending: false })

      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status)
      }
      if (options.startDate) {
        query = query.gte('created_at', options.startDate)
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      setRequests(data as Request[])

      // Calculate stats
      const total = data.length
      const pending = data.filter(r => r.status === 'pending').length
      const completed = data.filter(r => r.status === 'fulfilled').length
      setStats({ total, pending, completed })

    } catch (err) {
      console.error('Error fetching requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const createRequest = async (data: {
    product_id: string
    quantity: number
    budget: number
    notes?: string
  }) => {
    try {
      const { data: request, error } = await supabase
        .from('requests')
        .insert([{
          ...data,
          status: 'pending',
          customer_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error

      // Add initial status history
      await supabase
        .from('status_history')
        .insert([{
          request_id: request.id,
          status: 'pending',
          notes: 'Request created',
          updated_by: (await supabase.auth.getUser()).data.user?.id
        }])

      await fetchRequests()
      return request

    } catch (err) {
      console.error('Error creating request:', err)
      throw err
    }
  }

  return {
    requests,
    stats,
    loading,
    error,
    createRequest,
    refetch: fetchRequests
  }
} 