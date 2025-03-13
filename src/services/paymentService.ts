import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Invoice, RequestStatus } from '@/app/components/types/invoice'
import { NotificationService } from '@/services/notificationService'

export class PaymentService {
  private supabase = createClientComponentClient()

  async createPaymentIntent(invoice: Invoice) {
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const data = await response.json();
    return {
      clientSecret: data.clientSecret,
      customerId: data.customerId
    };
  }

  async updateInvoiceStatus(invoiceId: string, status: Invoice['status']) {
    const { error } = await this.supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId)

    if (error) throw error
  }

  async processPayment(paymentIntentId: string, invoiceId: string) {
    try {
      // Start transaction
      await this.updateInvoiceStatus(invoiceId, 'processing')

      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, invoiceId }),
      })

      if (!response.ok) throw new Error('Payment processing failed')

      // Get request ID for the invoice
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('request_id')
        .eq('id', invoiceId)
        .single()

      if (invoice?.request_id) {
        // Update both invoice and request status
        await Promise.all([
          this.updateInvoiceStatus(invoiceId, 'paid'),
          this.updateRequestStatus(invoice.request_id, 'fulfilled')
        ])

        // Send notification for status change
        const notificationService = new NotificationService()
        await notificationService.sendStatusUpdateNotification(
          invoice.request_id,
          'fulfilled',
          {
            previousStatus: 'approved'
          }
        )
      }

      // Update invoice status to paid on success
      await this.updateInvoiceStatus(invoiceId, 'paid')

      return await response.json()
    } catch (error) {
      // Update invoice status to failed on error
      await this.updateInvoiceStatus(invoiceId, 'cancelled')
      throw error
    }
  }

  private async updateRequestStatus(requestId: string, status: RequestStatus) {
    const { error } = await this.supabase
      .from('requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) throw error
  }
}

export const paymentService = new PaymentService() 