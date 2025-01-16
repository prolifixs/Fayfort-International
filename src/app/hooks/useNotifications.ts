import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/useToast'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      setNotifications(data)
      setLoading(false)
    }

    // Initial fetch
    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        (payload) => {
          setNotifications(current => [payload.new, ...current])
          toast({
            title: 'New Notification',
            description: payload.new.content,
            variant: 'default'
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { notifications, loading }
} 