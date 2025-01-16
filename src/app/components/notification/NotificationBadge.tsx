'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Bell,
  CreditCard,
  FileText,
  Clock
} from 'lucide-react'
import { cn } from '@/app/components/lib/utils'
import { NotificationType } from '@/app/components/types/database.types'

interface NotificationBadgeProps {
  type: NotificationType
  className?: string
}

export function NotificationBadge({ type, className }: NotificationBadgeProps) {
  const [count, setCount] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUnreadCount()

    const channel = supabase
      .channel('notification_count')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchUnreadCount() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read_status', false)

    setCount(count || 0)
  }

  const badges = {
    success: {
      icon: CheckCircle,
      className: 'text-green-500 bg-green-50'
    },
    error: {
      icon: XCircle,
      className: 'text-red-500 bg-red-50'
    },
    warning: {
      icon: AlertCircle,
      className: 'text-yellow-500 bg-yellow-50'
    },
    info: {
      icon: Info,
      className: 'text-blue-500 bg-blue-50'
    },
    status_change: {
      icon: Bell,
      className: 'text-purple-500 bg-purple-50'
    },
    invoice_ready: {
      icon: FileText,
      className: 'text-indigo-500 bg-indigo-50'
    },
    invoice_paid: {
      icon: CreditCard,
      className: 'text-green-500 bg-green-50'
    },
    payment_received: {
      icon: CreditCard,
      className: 'text-green-500 bg-green-50'
    },
    payment_due: {
      icon: Clock,
      className: 'text-orange-500 bg-orange-50'
    },
    request_update: {
      icon: Bell,
      className: 'text-blue-500 bg-blue-50'
    }
  }

  const { icon: Icon, className: badgeClassName } = badges[type]

  return (
    <div className={`relative ${className}`}>
      <div className={`p-2 rounded-full ${badgeClassName}`}>
        <Icon className="h-5 w-5" />
      </div>
      {count > 0 && (
        <div className={cn(
          "absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
        )}>
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  )
}