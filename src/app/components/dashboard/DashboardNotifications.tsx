'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Bell, X, FileText, CreditCard, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { formatDistanceToNow } from 'date-fns'

interface DashboardNotification {
  id: string
  type: 'status_change' | 'invoice_ready' | 'payment_received'
  content: string
  read_status: boolean
  created_at: string
  reference_id: string
}

export function DashboardNotifications() {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    console.log('DashboardNotifications - Initializing')
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('DashboardNotifications - Current user:', user)
      if (!user) {
        console.log('DashboardNotifications - No user found')
        return
      }

      const channel = supabase
        .channel('dashboard_notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'requests',
            filter: `customer_id=eq.${user.id}`
          },
          (payload) => {
            console.log('DashboardNotifications - Request change detected:', {
              eventType: payload.eventType,
              payload
            })
            if (payload.eventType === 'INSERT') {
              console.log('DashboardNotifications - New request created:', payload.new)
              toast({
                title: 'New Request Created',
                description: `Request #${payload.new.id} has been created`,
                variant: 'default'
              })
              fetchNotifications()
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            console.log('DashboardNotifications - Notification change detected:', payload)
            const newNotification = payload.new as DashboardNotification
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [newNotification, ...prev])
              updateUnreadCount([newNotification, ...notifications])
              
              toast({
                title: getNotificationTitle(newNotification.type),
                description: newNotification.content,
                variant: 'default'
              })
            }
          }
        )
        .subscribe((status) => {
          console.log('DashboardNotifications - Channel status:', status)
        })

      console.log('DashboardNotifications - Subscription setup complete')
      return () => {
        console.log('DashboardNotifications - Cleaning up channel')
        supabase.removeChannel(channel)
      }
    }

    console.log('DashboardNotifications - Starting setup')
    fetchNotifications()
    const subscription = setupSubscription()

    return () => {
      console.log('DashboardNotifications - Component unmounting')
      subscription.then(cleanup => cleanup?.())
    }
  }, [])

  async function fetchNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      setNotifications(data)
      updateUnreadCount(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: 'Error fetching notifications',
        description: 'Please try again later',
        variant: 'destructive'
      })
    }
  }

  function updateUnreadCount(notifs: DashboardNotification[]) {
    const count = notifs.filter(n => !n.read_status).length
    setUnreadCount(count)
  }

  function getNotificationTitle(type: string) {
    switch (type) {
      case 'status_change':
        return 'Status Updated'
      case 'invoice_ready':
        return 'Invoice Ready'
      case 'payment_received':
        return 'Payment Received'
      default:
        return 'New Notification'
    }
  }

  async function markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_status: true })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, read_status: true } : n
        )
      )
      updateUnreadCount(notifications)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'status_change':
        return <RefreshCw className="h-5 w-5 text-blue-500" />
      case 'invoice_ready':
        return <FileText className="h-5 w-5 text-purple-500" />
      case 'payment_received':
        return <CreditCard className="h-5 w-5 text-green-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  function getNotificationBgColor(type: string): string {
    switch (type) {
      case 'status_change': return 'bg-blue-50'
      case 'invoice_ready': return 'bg-purple-50'
      case 'payment_received': return 'bg-green-50'
      default: return 'bg-gray-50'
    }
  }

  function EmptyState() {
    return (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">No new notifications</p>
      </div>
    )
  }

  function NotificationsList({ notifications, onMarkAsRead }: { 
    notifications: DashboardNotification[], 
    onMarkAsRead: (id: string) => void 
  }) {
    return (
      <div className="divide-y divide-gray-100">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 hover:bg-gray-50/50 transition-colors ${
              !notification.read_status ? `${getNotificationBgColor(notification.type)}` : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {getNotificationTitle(notification.type)}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {notification.content}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <time className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </time>
                  {!notification.read_status && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="text-xs flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Mark as read</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 text-xs font-medium flex items-center justify-center bg-red-500 text-white rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <EmptyState />
              ) : (
                <NotificationsList notifications={notifications} onMarkAsRead={markAsRead} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 