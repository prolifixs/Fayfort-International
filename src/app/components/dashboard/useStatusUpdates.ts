'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { RequestStatus } from '@/app/components/types/database.types'

interface Request {
  id: string
  status: 'request' | 'processing' | 'completed'
  updated_at: string
}

export function useStatusUpdates(requestId?: string) {
  const [status, setStatus] = useState<RequestStatus | null>(null)
  const supabase = createSupabaseBrowserClient()

  async function fetchStatus() {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('status')
        .eq('id', requestId)
        .single()

      if (error) throw error
      setStatus(data.status)
    } catch (error) {
      console.error('Error fetching status:', error)
    }
  }

  useEffect(() => {
    if (!requestId) return

    // Initial fetch
    fetchStatus()

    // Real-time subscription
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${requestId}`
        },
        (payload) => {
          setStatus(payload.new.status)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId])

  return { status }
} 