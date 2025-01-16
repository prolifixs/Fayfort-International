'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Bell, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${
                      notification.read_status ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getNotificationTitle(notification.type)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read_status && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
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