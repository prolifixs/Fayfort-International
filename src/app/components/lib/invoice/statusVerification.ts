import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { InvoiceStatus } from '@/app/components/types/invoice'

export class InvoiceVerificationService {
  private supabase = createClientComponentClient()

  async checkInvoiceStatus(requestId: string): Promise<InvoiceStatus> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('status')
      .eq('request_id', requestId)
      .single()

    if (error) throw error
    return data.status
  }

  async validatePaymentStatus(invoiceId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single()

    if (error) throw error
    return data.status === 'paid'
  }

  async updateRequestStatus(requestId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('requests')
      .update({ resolution_status: status })
      .eq('id', requestId)

    if (error) throw error
  }
} 