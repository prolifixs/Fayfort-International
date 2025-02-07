'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Bell, Check } from 'lucide-react'
import { NotificationIcon } from './NotificationIcon'
import { NotificationBadge } from './NotificationBadge'
import { Database } from '@/app/components/types/database.types'
import { useToast } from '@/hooks/useToast'
import { formatDistanceToNow } from 'date-fns'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationType = Notification['type']

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
    const subscription = subscribeToNotifications()
    return () => {
      subscription()
    }
  }, [isOpen])

  useEffect(() => {
    updateUnreadCount(notifications)
  }, [notifications])

  function updateUnreadCount(notifs: Notification[]) {
    const count = notifs.filter(n => !n.read_status).length
    setUnreadCount(count)
  }

  function subscribeToNotifications() {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        handleNotificationUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleNotificationUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setNotifications(prev => [payload.new as Notification, ...prev])
      toast({
        title: getNotificationTitle(payload.new.type),
        description: payload.new.content,
        variant: 'default'
      })
    } else if (payload.eventType === 'UPDATE') {
      setNotifications(prev =>
        prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
      )
    } else if (payload.eventType === 'DELETE') {
      setNotifications(prev =>
        prev.filter(n => n.id !== payload.old.id)
      )
    }
  }

  function getNotificationTitle(type: NotificationType) {
    switch (type) {
      case 'status_change':
        return 'Status Updated'
      case 'invoice_ready':
        return 'Invoice Ready'
      case 'invoice_paid':
        return 'Invoice Paid'
      case 'payment_received':
        return 'Payment Received'
      case 'payment_due':
        return 'Payment Due'
      case 'request_update':
        return 'Request Updated'
      default:
        return 'New Notification'
    }
  }

  async function fetchNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)
      
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('Notification query result:', { data, error })
      
      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Full error details:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch notifications',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_status: true })
        .eq('id', id)

      if (error) throw error
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read_status: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      })
    }
  }

  async function markAllAsRead() {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_status: true })
        .eq('read_status', false)

      if (error) throw error
      setNotifications(notifications.map(n => ({ ...n, read_status: true })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive'
      })
    }
  }

  function getTimeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' years ago'
    
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' months ago'
    
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' days ago'
    
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' hours ago'
    
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' minutes ago'
    
    return Math.floor(seconds) + ' seconds ago'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <NotificationIcon count={unreadCount} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 max-h-[80vh] overflow-y-auto z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              {notifications.some(n => !n.read_status) && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-4 rounded-md transition-colors ${
                      notification.read_status ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <NotificationBadge type={notification.type} />
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{notification.content}</p>
                    </div>
                    {!notification.read_status && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 