'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RequestWithRelations, RequestFormData } from '../components/types/request.types'
import { SupabaseRequestResponse, isSupabaseRequestResponse } from '../components/types/database.types'

interface UseRequestsOptions {
  status?: string
  startDate?: string
  endDate?: string
}

export function useRequests(options: UseRequestsOptions = {}) {
  const [requests, setRequests] = useState<RequestWithRelations[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  // Memoize options to prevent infinite loops
  const memoizedOptions = useMemo(() => ({
    status: options.status,
    startDate: options.startDate,
    endDate: options.endDate
  }), [options.status, options.startDate, options.endDate])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('requests')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          quantity,
          budget,
          notes,
          customer_id,
          product_id,
          product:products (
            name,
            category,
            image_url
          ),
          customer:users (
            name,
            email
          ),
          status_history (
            id,
            status,
            notes,
            created_at,
            updated_by (
              id,
              name
            )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (memoizedOptions.status && memoizedOptions.status !== 'all') {
        query = query.eq('status', memoizedOptions.status)
      }
      if (memoizedOptions.startDate) {
        query = query.gte('created_at', memoizedOptions.startDate)
      }
      if (memoizedOptions.endDate) {
        query = query.lte('created_at', memoizedOptions.endDate)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const transformedData = data?.map(item => {
        if (!isSupabaseRequestResponse(item)) {
          throw new Error('Invalid response format from Supabase');
        }
        return {
          ...item,
          product: item.product[0],
          customer: item.customer[0]
        };
      }) || [];

      setRequests(transformedData as RequestWithRelations[]);

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

  const createRequest = async (formData: RequestFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: request, error } = await supabase
        .from('requests')
        .insert([{
          ...formData,
          status: 'pending',
          customer_id: user.id
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
          updated_by: user.id
        }])

      await fetchRequests()
      return request

    } catch (err) {
      console.error('Error creating request:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [memoizedOptions])

  return {
    requests,
    stats,
    loading,
    error,
    createRequest,
    refetch: fetchRequests
  }
} 