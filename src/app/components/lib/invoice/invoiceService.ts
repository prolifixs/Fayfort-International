import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export class InvoiceService {
  private supabase = createClientComponentClient()

  async validatePaymentStatus(invoiceId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single()
    
    if (error) throw error
    return data?.status === 'paid'
  }
} 