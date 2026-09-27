import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { InvoiceStatus, RequestStatus, REQUEST_TO_INVOICE_STATUS } from '@/app/components/types/invoice'

export class InvoiceService {
  private supabase = createSupabaseBrowserClient()

  async validatePaymentStatus(invoiceId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single()
    
    if (error) throw error
    return data?.status === 'paid'
  }

  async syncInvoiceStatus(requestId: string, requestStatus: RequestStatus): Promise<void> {
    const newInvoiceStatus = REQUEST_TO_INVOICE_STATUS[requestStatus];
    
    const { error } = await this.supabase
      .from('invoices')
      .update({ status: newInvoiceStatus })
      .eq('request_id', requestId);

    if (error) throw error;
  }
} 