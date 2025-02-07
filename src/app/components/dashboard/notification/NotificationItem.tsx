'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCircle, AlertCircle, FileText, CreditCard } from 'lucide-react'
import { DashboardNotification } from '@/app/components/types/notifications'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface NotificationItemProps {
  notification: DashboardNotification
  onMarkAsRead: (id: string) => void
  onClick: (notification: DashboardNotification) => void
}

export function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.read_status)
  const supabase = createClientComponentClient()

  const getIcon = () => {
    switch (notification.type) {
      case 'status_change':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'invoice_ready':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'payment_received':
        return <CreditCard className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-400" />
    }
  }

  const handleMarkAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_status: true })
        .eq('id', notification.id)

      if (error) throw error

      setIsRead(true)
      onMarkAsRead(notification.id)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  return (
    <div 
      className={`p-4 hover:bg-gray-50 ${!isRead ? 'bg-blue-50' : ''}`}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-grow">
          <div className="flex justify-between">
            <p className="text-sm font-medium text-gray-900">
              {notification.content}
            </p>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
          </div>
          {notification.metadata && (
            <p className="mt-1 text-sm text-gray-500">
              {/* Add any additional metadata display logic here */}
            </p>
          )}
        </div>
        {!isRead && (
          <button
            onClick={handleMarkAsRead}
            className="flex-shrink-0 ml-4 text-sm text-blue-600 hover:text-blue-800"
          >
            <CheckCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
} 