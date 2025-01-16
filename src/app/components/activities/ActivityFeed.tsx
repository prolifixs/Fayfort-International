'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Activity } from '@/app/components/types/database.types'
import { activityService } from '@/services/activityService'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface InvoiceMetadata {
  invoice_id: string;
}

export function ActivityFeed() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
    setupRealtimeSubscription()
  }, [])

  const fetchActivities = async () => {
    try {
      const { data, error } = await activityService.getRecentActivities()
      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const supabase = createClientComponentClient()
    
    supabase
      .channel('activities')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activities' },
        (payload) => {
          setActivities(current => [payload.new as Activity, ...current])
        }
      )
      .subscribe()
  }

  const handleActivityClick = (activity: Activity) => {
    if (activity.type === 'invoice_generated' && (activity.metadata as unknown as InvoiceMetadata)?.invoice_id) {
      router.push(`/dashboard/invoices/${(activity.metadata as unknown as InvoiceMetadata).invoice_id}`)
    }
  }

  if (loading) return <div>Loading activity feed...</div>

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li 
            key={activity.id}
            onClick={() => handleActivityClick(activity)}
            className={activity.type === 'invoice_generated' ? 'cursor-pointer hover:bg-gray-50' : ''}
          >
            <div className="p-4 bg-white rounded-lg border">
              <p className="font-medium">{activity.content}</p>
              <p className="text-sm text-gray-500">
                {new Date(activity.created_at).toLocaleDateString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
} 