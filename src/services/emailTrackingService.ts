import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { EmailTrackingData } from '@/app/components/types/email'

export class EmailTrackingService {
  private supabase = createClientComponentClient()

  async trackDeliveryStatus(emailId: string, status: 'delivered' | 'failed' | 'bounced') {
    try {
      await this.supabase
        .from('email_tracking')
        .upsert({
          email_id: emailId,
          delivery_status: status,
          updated_at: new Date().toISOString()
        })
      
      console.log(`Email ${emailId} delivery status updated: ${status}`)
    } catch (error) {
      console.error('Failed to track delivery status:', error)
      throw error
    }
  }

  async trackOpen(emailId: string) {
    try {
      await this.supabase.rpc('increment_open_count', {
        email_id: emailId,
        opened_time: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to track email open:', error)
      throw error
    }
  }

  async trackClick(emailId: string, linkUrl: string) {
    try {
      await this.supabase
        .from('email_click_tracking')
        .insert({
          email_id: emailId,
          link_url: linkUrl,
          clicked_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to track email click:', error)
      throw error
    }
  }

  async getEmailAnalytics(emailId: string): Promise<EmailTrackingData> {
    try {
      const { data, error } = await this.supabase
        .from('email_tracking')
        .select(`
          *,
          email_click_tracking (*)
        `)
        .eq('email_id', emailId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get email analytics:', error)
      throw error
    }
  }
}

export const emailTrackingService = new EmailTrackingService() 