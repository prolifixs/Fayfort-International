'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { StatusBadge } from './StatusBadge'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  CreditCard, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

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

function getActivityIcon(type: Activity['type'], status?: string) {
  switch (type) {
    case 'invoice_generated':
      return <FileText className="h-4 w-4 text-purple-500" />
    case 'payment_received':
      return <CreditCard className="h-4 w-4 text-green-500" />
    case 'status_change':
      switch (status) {
        case 'approved':
          return <CheckCircle className="h-4 w-4 text-green-500" />
        case 'rejected':
          return <AlertCircle className="h-4 w-4 text-red-500" />
        default:
          return <Clock className="h-4 w-4 text-blue-500" />
      }
    default:
      return <RefreshCw className="h-4 w-4 text-gray-500" />
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
      if (!user) return

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
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
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="flex space-x-3">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div 
                className={`relative flex space-x-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all
                  ${activity.type === 'invoice_generated' ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''}`}
                onClick={() => handleActivityClick(activity)}
              >
                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center ring-8 ring-white">
                  {getActivityIcon(activity.type, activity.metadata.status)}
                </div>
                <div className="flex min-w-0 flex-1 justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.content}
                    </p>
                    <div className="mt-2 space-x-2">
                      {renderBadges(activity)}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <time className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </time>
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