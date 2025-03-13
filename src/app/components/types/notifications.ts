export type NotificationType = 
  | 'status_change'
  | 'invoice_ready'
  | 'payment_received'
  | 'request_update'
  | 'invoice_paid'
  | 'payment_due'

export interface NotificationMetadata {
  status?: string;
  invoice_id?: string;
  payment_status?: string;
  previousStatus?: string;
  productName?: string;
  request_id?: string;
}

export interface DashboardNotification {
  id: string
  type: NotificationType
  content: string
  read_status: boolean
  created_at: string
  reference_id: string
  metadata?: NotificationMetadata
} 