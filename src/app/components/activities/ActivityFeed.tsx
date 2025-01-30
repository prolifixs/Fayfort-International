'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Activity } from '@/app/components/types/database.types'
import { activityService } from '@/services/activityService'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FileText, CreditCard, RefreshCcw, AlertCircle, Download, X } from 'lucide-react'
import { useToast } from '@/app/hooks/useToast'
import { StatusBadge } from '../ui/StatusBadge'
import { motion } from 'framer-motion'

type ActivityMetadata = {
  status?: 'approved' | 'rejected' | 'pending';
  [key: string]: any;
};

type InvoiceMetadata = {
  invoice_id: string;
  [key: string]: any;
};

function getActivityBackgroundColor(type: Activity['type']): string {
  switch (type) {
    case 'invoice_generated': return 'rgb(147, 51, 234, 0.1)' // Purple
    case 'payment_received': return 'rgb(22, 163, 74, 0.1)'   // Green
    case 'status_change': return 'rgb(59, 130, 246, 0.1)'     // Blue
    default: return 'rgb(107, 114, 128, 0.1)'                 // Gray
  }
}

function formatTimeAgo(date: string): string {
  const now = new Date()
  const activityDate = new Date(date)
  const diffInHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 24) {
    return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`
  }
  return activityDate.toLocaleDateString()
}

function getActivityIcon(type: Activity['type'], status?: string) {
  switch (type) {
    case 'invoice_generated':
      return <FileText className="h-5 w-5 text-purple-500" />
    case 'payment_received':
      return <CreditCard className="h-5 w-5 text-green-500" />
    case 'status_change':
      return <RefreshCcw className="h-5 w-5 text-blue-500" />
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />
  }
}

function renderBadges(activity: Activity) {
  if (activity.type === 'status_change' && (activity.metadata as ActivityMetadata)?.status) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${(activity.metadata as ActivityMetadata).status === 'approved' ? 'bg-green-100 text-green-800' : 
          (activity.metadata as ActivityMetadata).status === 'rejected' ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'}`}>
        {(activity.metadata as ActivityMetadata).status}
      </span>
    )
  }
  return null
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
      const { data, error } = await activityService.getRecentActivities()
      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast({
        title: 'Error fetching activities',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleActivityClick = (activity: Activity) => {
    if (activity.type === 'invoice_generated' && (activity.metadata as InvoiceMetadata)?.invoice_id) {
      router.push(`/dashboard/invoices/${(activity.metadata as InvoiceMetadata).invoice_id}`)
    }
  }

  const handleDismiss = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)

      if (error) throw error
      setActivities(prev => prev.filter(activity => activity.id !== activityId))
      toast({
        title: 'Activity dismissed',
        description: 'The activity has been removed from your feed',
      })
    } catch (error) {
      console.error('Error dismissing activity:', error)
      toast({
        title: 'Error dismissing activity',
        description: 'Please try again later',
        variant: 'destructive'
      })
    }
  }

  function renderBadges(activity: Activity) {
    const badges = []

    if ((activity.metadata as ActivityMetadata)?.status) {
      badges.push(
        <StatusBadge key="status" status={(activity.metadata as ActivityMetadata).status} />
      )
    }


    if (activity.type === 'invoice_generated') {
      badges.push(
        <span key="invoice" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Invoice Ready
        </span>
      )
    }

    if ((activity.metadata as ActivityMetadata)?.payment_status) {
      badges.push(
        <span key="payment" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {(activity.metadata as ActivityMetadata).payment_status}
        </span>
      )
    }


    return badges
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="animate-pulse flex space-x-4 p-4 bg-white rounded-lg border border-gray-100">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-100 shadow-sm"
      >
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Activities Yet</h3>
        <p className="text-gray-500 text-center">
          New activities will appear here as they happen
        </p>
      </motion.div>
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
                  {getActivityIcon(activity.type, (activity.metadata as ActivityMetadata)?.status)}
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
                  <div className="ml-4 flex-shrink-0 flex items-start space-x-2">
                    <time className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTimeAgo(activity.created_at)}
                    </time>
                    <div className="flex space-x-1 ml-2">
                      {activity.type === 'invoice_generated' && (
                        <button
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          disabled
                          onClick={(e) => {
                            e.stopPropagation()
                            // Download functionality will be implemented later
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDismiss(activity.id)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
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