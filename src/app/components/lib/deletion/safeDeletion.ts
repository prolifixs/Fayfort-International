import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export class SafeDeletionService {
  private supabase = createClientComponentClient()

  async verifyRequestCount(productId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('products')
      .select('requests(id)')
      .eq('id', productId)
      .single()

    if (error) throw error
    return data.requests.length === 0
  }

  async checkDeletionSafety(requestId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('requests')
      .select(`
        status,
        admin_processing,
        resolution_statuses (
          status
        )
      `)
      .eq('id', requestId)
      .single()

    if (error) throw error
    
    // Prevent deletion if admin is processing
    if (data.admin_processing) return false
    
    // Allow deletion for pending base status
    if (data.status === 'pending') {
      // Check if there's no resolution status yet
      return !data.resolution_statuses || data.resolution_statuses.length === 0
    }
    
    // For non-pending requests, check resolution status
    return data.resolution_statuses?.[0]?.status === 'notified'
  }

  async processDelete(requestId: string): Promise<void> {
    const { error: deleteError } = await this.supabase
      .from('requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) throw deleteError

    // Update product request count
    const { error: updateError } = await this.supabase.rpc('update_product_request_count', {
      request_id: requestId
    })

    if (updateError) throw updateError
  }

  async handleRollback(requestId: string): Promise<void> {
    const { error } = await this.supabase
      .from('requests')
      .update({
        notification_sent: false,
        notification_type: null,
        last_notification_date: null
      })
      .eq('id', requestId)

    if (error) throw error
  }
} 