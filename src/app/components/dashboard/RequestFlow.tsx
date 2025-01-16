'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { StatusBadge } from './StatusBadge'
import { StatusChangeForm } from './StatusChangeForm'
import { useStatusUpdates } from './useStatusUpdates'
import { useToast } from '@/hooks/useToast'

interface Request {
  id: string
  status: 'request' | 'processing' | 'completed'
  created_at: string
  updated_at: string
  user_id: string
  details: any
}

export function RequestFlow({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(true)
  const { status } = useStatusUpdates(requestId)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchRequest()
  }, [])

  useEffect(() => {
    if (status && request) {
      setRequest(prev => prev ? { ...prev, status } : null)
    }
  }, [status])

  async function fetchRequest() {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          users (
            email,
            notification_preferences
          )
        `)
        .eq('id', requestId)
        .single()

      if (error) throw error
      setRequest(data)
    } catch (error) {
      console.error('Error fetching request:', error)
      toast({
        title: 'Error fetching request',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange() {
    await fetchRequest()
  }

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (!request) {
    return <div>Request not found</div>
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Request #{request.id}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Created on {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <StatusChangeForm
            requestId={request.id}
            currentStatus={request.status}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-900">Request Timeline</h3>
        <div className="mt-2 space-y-4">
          {/* Status change history would go here */}
          <div className="flex items-center text-sm">
            <span className="h-2 w-2 bg-green-400 rounded-full mr-2" />
            <span className="text-gray-500">
              Status changed to {request.status}
            </span>
            <span className="ml-2 text-gray-400">
              {new Date(request.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 