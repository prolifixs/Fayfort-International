import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DashboardNotification, NotificationType, NotificationMetadata } from '@/app/components/types/notifications'

export async function createNotification({
  type,
  content,
  reference_id,
  reference_type,
  metadata = {}
}: {
  type: NotificationType
  content: string
  reference_id: string
  reference_type: string
  metadata?: Record<string, any>
}) {
  const supabase = createClientComponentClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .insert([{
        type,
        content,
        reference_id,
        reference_type,
        metadata,
        user_id: user.id,
        read_status: false,
        created_at: new Date().toISOString()
      }])

    if (error) throw error
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export function getNotificationMessage(type: NotificationType, metadata: NotificationMetadata = {}) {
  switch (type) {
    case 'invoice_ready':
      return `Invoice #${metadata.invoice_id} is ready for review`
    case 'invoice_paid':
      return `Payment received for invoice #${metadata.invoice_id}`
    case 'payment_due':
      return `Payment is due for invoice #${metadata.invoice_id}`
    case 'status_change':
      return metadata.productName 
        ? `Status for ${metadata.productName} changed from ${metadata.previousStatus} to ${metadata.status}`
        : `Status changed to ${metadata.status}`;
    case 'request_update':
      return `Your request #${metadata.request_id} has been updated`
    default:
      return 'New notification received'
  }
} 