import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/app/components/types/database.types'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationType = Notification['type']

class NotificationService {
  private supabase = createClientComponentClient()
  private listeners: ((notifications: Notification[]) => void)[] = [];

  async createNotification(data: {
    type: NotificationType;
    content: string;
    reference_id?: string;
    metadata?: any;
  }) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    return this.supabase.from('notifications').insert({
      ...data,
      user_id: user.id,
      read_status: false
    })
  }

  async getNotifications(options?: { unreadOnly?: boolean }) {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq('read_status', false)
    }

    return query
  }

  async markAsRead(notificationId: string) {
    return this.supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('id', notificationId)
  }

  async markAllAsRead() {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    return this.supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('user_id', user.id)
      .eq('read_status', false)
  }

  async getUnreadCount() {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read_status', false)

    if (error) throw error
    return count || 0
  }

  subscribeToNotifications(callback: (payload: any) => void) {
    return this.supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' },
        callback
      )
      .subscribe()
  }
}

export const notificationService = new NotificationService(); 