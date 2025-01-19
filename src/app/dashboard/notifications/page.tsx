'use client'

import { useState } from 'react'
import { NotificationList } from '@/app/components/notification/NotificationList'
import { NotificationFilters } from '@/app/components/notification/NotificationFilters'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/useToast'

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [type, setType] = useState<'all' | 'status_change' | 'invoice_ready' | 'payment_received'>('all')
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_status: true })
        .eq('read_status', false)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
            <NotificationFilters 
              filter={filter}
              type={type}
              onFilterChange={setFilter}
              onTypeChange={setType}
            />
          </div>

          <NotificationList filter={filter} type={type} />
        </div>
      </div>
    </div>
  )
} 