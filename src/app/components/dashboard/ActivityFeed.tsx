'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { StatusBadge } from './StatusBadge'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'

interface Activity {
  id: string
  type: 'status_change' | 'invoice_generated' | 'payment_received'
  content: string
  reference_id: string
  created_at: string
  metadata: {
    status?: string
    invoice_id?: string
    payment_status?: string
  }
}

export function ActivityFeed() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchActivities()
    const channel = supabase
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setActivities(prev => [payload.new as Activity, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setActivities(prev =>
              prev.map(activity =>
                activity.id === payload.new.id
                  ? { ...activity, ...payload.new }
                  : activity
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchActivities() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('ActivityFeed - Current user:', user)
      if (!user) return

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('ActivityFeed - Raw fetch result:', { data, error })
      
      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('ActivityFeed - Error fetching activities:', error)
    }
  }

  const handleActivityClick = (activity: Activity) => {
    if (activity.type === 'invoice_generated' && activity.metadata.invoice_id) {
      router.push(`/dashboard/invoices/${activity.metadata.invoice_id}`)
    }
  }

  function renderBadges(activity: Activity) {
    const badges = []

    if (activity.metadata.status) {
      badges.push(
        <StatusBadge key="status" status={activity.metadata.status} />
      )
    }

    if (activity.type === 'invoice_generated') {
      badges.push(
        <span key="invoice" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Invoice Ready
        </span>
      )
    }

    if (activity.metadata.payment_status) {
      badges.push(
        <span key="payment" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {activity.metadata.payment_status}
        </span>
      )
    }

    return badges
  }

  if (loading) {
    return <div className="animate-pulse">Loading activities...</div>
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div 
                className="relative flex space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2"
                onClick={() => handleActivityClick(activity)}
              >
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                    {/* Icon based on activity type */}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      {activity.content}
                    </p>
                    <div className="mt-2 space-x-2">
                      {renderBadges(activity)}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    {new Date(activity.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
} 