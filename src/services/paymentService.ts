import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Invoice, RequestStatus } from '@/app/components/types/invoice'
import { NotificationService } from '@/services/notificationService'
import { config } from '../config/env'
import Stripe from 'stripe'

export class PaymentService {
  private supabase = createClientComponentClient()
  private stripe: Stripe

  constructor() {
    const stripeKey = config.isProduction 
      ? process.env.STRIPE_LIVE_SECRET_KEY 
      : process.env.STRIPE_TEST_SECRET_KEY;

    if (!stripeKey) {
      throw new Error(`Stripe ${config.isProduction ? 'live' : 'test'} key not configured`);
    }
    
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-02-24.acacia'
    })
  }

  async createPaymentIntent(invoice: Invoice) {
    try {
      if (!config.isProduction) {
        console.log('🔧 Test Mode Active:');
        console.log('- Use card: 4242424242424242');
        console.log('- Any future date for expiry');
        console.log('- Any 3 digits for CVC');
      }

      const intent = await this.stripe.paymentIntents.create({
        amount: invoice.amount * 100,
        currency: 'usd',
        metadata: {
          invoiceId: invoice.id,
          environment: config.isProduction ? 'production' : 'test',
          createdAt: new Date().toISOString()
        }
      })

      return {
        clientSecret: intent.client_secret,
        customerId: intent.customer,
        testMode: !config.isProduction
      }
    } catch (error) {
      console.error('Payment intent creation failed:', error)
      throw error
    }
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
      await this.updateInvoiceStatus(invoiceId, 'processing')

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not successful')
      }

      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('request_id, user_id')
        .eq('id', invoiceId)
        .single()

      if (invoice?.request_id) {
        await Promise.all([
          this.updateInvoiceStatus(invoiceId, 'paid'),
          this.updateRequestStatus(invoice.request_id, 'fulfilled'),
          this.notifyPaymentSuccess(invoice)
        ])
      }

      return { success: true, invoice }
    } catch (error) {
      await this.updateInvoiceStatus(invoiceId, 'failed')
      throw error
    }
  }

  private async notifyPaymentSuccess(invoice: { request_id: string; user_id: string }) {
    const notificationService = new NotificationService()
    await notificationService.sendStatusUpdateNotification(
      invoice.request_id,
      'fulfilled',
      { previousStatus: 'approved' }
    )
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