'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { NotificationItem } from '@/app/components/dashboard/notification/NotificationItem'
import { NotificationSkeleton } from '@/app/components/dashboard/notification/NotificationSkeleton'
import { DashboardNotification } from '@/app/components/types/notifications'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'

interface NotificationListProps {
  filter: 'all' | 'unread' | 'read'
  type: 'all' | 'status_change' | 'invoice_ready' | 'payment_received'
}

export function NotificationList({ filter, type }: NotificationListProps) {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [filter, type])

  async function fetchNotifications() {
    try {
      setLoading(true)
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filter === 'unread') {
        query = query.eq('read_status', false)
      } else if (filter === 'read') {
        query = query.eq('read_status', true)
      }

      if (type !== 'all') {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) throw error

      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: 'Error fetching notifications',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read_status: true } : n))
    )
  }

  const handleNotificationClick = (notification: DashboardNotification) => {
    if (notification.type === 'invoice_ready') {
      router.push(`/dashboard/invoices/${notification.reference_id}`)
    } else if (notification.type === 'status_change') {
      router.push(`/dashboard/requests/${notification.reference_id}`)
    }
    handleMarkAsRead(notification.id)
  }

  if (loading) {
    return <NotificationSkeleton />
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No notifications found
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={handleMarkAsRead}
          onClick={handleNotificationClick}
        />
      ))}
    </div>
  )
} 