import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { InvoiceVerificationService } from '@/app/components/lib/invoice/statusVerification'
import { InvoiceService } from '@/app/components/lib/invoice/invoiceService'
import { NotificationType } from '@/services/notificationService'
import { RequestStatus, ResolutionStatus } from '@/app/components/types/database.types'



interface RequestWithProduct {
  id: string;
  customer_id: string;
  product: {
    id: string;
    name: string;
  };
}

interface RequestData {
  status: string;
  resolution_status: string;
  product: {
    status: 'active' | 'inactive';
  };
}

interface StatusChangeContext {
  type: 'request' | 'product' | 'invoice' | 'resolution'
  status: RequestStatus
  notificationType: NotificationType
}

const statusChangeMap: Record<RequestStatus, StatusChangeContext> = {
  pending: {
    type: 'request',
    status: 'pending',
    notificationType: 'payment_pending'
  },
  approved: {
    type: 'request',
    status: 'approved',
    notificationType: 'success'
  },
  fulfilled: {
    type: 'request',
    status: 'fulfilled',
    notificationType: 'payment_confirmed'
  },
  shipped: {
    type: 'request',
    status: 'shipped',
    notificationType: 'success'
  },
  rejected: {
    type: 'request',
    status: 'rejected',
    notificationType: 'status_change'
  },
  notified: {
    type: 'resolution',
    status: 'notified',
    notificationType: 'unavailable'
  },
  resolved: {
    type: 'resolution',
    status: 'resolved',
    notificationType: 'success'
  }
}

export class RequestProcessingService {
  private supabase = createClientComponentClient()
  private verificationService = new InvoiceVerificationService()
  private invoiceService = new InvoiceService()

  private getStatusContext(status: RequestStatus): StatusChangeContext {
    return statusChangeMap[status] || statusChangeMap.pending
  }

  public async updateRequestStatus(
    requestId: string, 
    status: RequestStatus | ResolutionStatus,
    type: 'request' | 'resolution' = 'request'
  ): Promise<void> {
    const statusContext = statusChangeMap[status];
    const { error } = await this.supabase
      .from('requests')
      .update({ 
        [type === 'resolution' ? 'resolution_status' : 'status']: status,
        notification_type: statusContext.notificationType
      })
      .eq('id', requestId)
    
    if (error) throw error
  }

  private async updateNotificationStatus(requestId: string, notificationType: NotificationType): Promise<void> {
    await this.supabase
      .from('requests')
      .update({
        notification_sent: true,
        notification_type: notificationType,
        last_notification_date: new Date().toISOString()
      })
      .eq('id', requestId)
  }

  async sendNotifications(requestId: string, type: NotificationType): Promise<void> {
    try {
      await this.setAdminProcessing(requestId, true)
      const { data: request, error } = await this.supabase
        .from('requests')
        .select(`
          id,
          customer_id,
          product:products!inner(
            id,
            name
          )
        `)
        .eq('id', requestId)
        .single() as { data: RequestWithProduct, error: any }

      if (error) throw error

      // Update status based on notification type
      const statusMap: Record<NotificationType, RequestStatus> = {
        unavailable: 'pending',
        delayed: 'pending',
        cancelled: 'pending',
        success: 'approved',
        error: 'pending',
        warning: 'pending',
        info: 'pending',
        payment_confirmed: 'approved',
        payment_pending: 'pending',
        status_change: 'pending',
        shipping_confirmed: 'shipped'
      } as const;

      await this.updateRequestStatus(requestId, statusMap[type])

      // Send notification using the customer_id
      await this.supabase.from('notifications').insert({
        user_id: request.customer_id,
        type: type,
        message: this.getNotificationMessage(type, request.product.name),
        request_id: requestId,
        reference_type: 'request',
        reference_id: requestId
      })
    } finally {
      await this.setAdminProcessing(requestId, false)
    }
  }

  private getNotificationMessage(type: NotificationType, productName: string): string {
    const messages: Record<NotificationType, string> = {
      unavailable: `Product ${productName} is currently unavailable`,
      delayed: `Your request for ${productName} will be removed soon`,
      cancelled: `Product ${productName} has been cancelled`,
      success: `Product ${productName} request successful`,
      error: `Error processing ${productName} request`,
      warning: `Warning for ${productName} request`,
      info: `Update for ${productName}`,
      payment_confirmed: `Payment confirmed for ${productName}`,
      payment_pending: `Payment pending for ${productName}`,
      status_change: `Status change for ${productName}`,
      shipping_confirmed: `Shipping confirmed for ${productName}`
    };
    return messages[type];
  }

  async processPaidRequest(requestId: string): Promise<void> {
    try {
      await this.updateRequestStatus(requestId, 'approved')  // Remove third parameter
      await this.sendNotifications(requestId, 'payment_confirmed')
      await this.updateUserInterface(requestId)
    } catch (error) {
      console.error('Paid request processing error:', error)
      throw error
    }
  }

  async processUnpaidRequest(requestId: string): Promise<void> {
    try {
      await this.updateRequestStatus(requestId, 'pending')  // Remove third parameter
      await this.sendNotifications(requestId, 'payment_pending')
      await this.updateUserInterface(requestId)
    } catch (error) {
      console.error('Unpaid request processing error:', error)
      throw error
    }
  }

  private async updateUserInterface(requestId: string): Promise<void> {
    // Trigger real-time updates via WebSocket
    await this.broadcastStatusUpdate(requestId)
  }

  async getActiveRequestCount(productId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('requests')
      .select('id')
      .eq('product_id', productId)
      .eq('resolution_status', 'pending')
    
    if (error) throw error
    return data?.length || 0
  }

  async verifyProductDeletion(productId: string): Promise<boolean> {
    const activeCount = await this.getActiveRequestCount(productId)
    return activeCount === 0
  }

  async validateInvoicePayment(invoiceId: string): Promise<boolean> {
    return this.invoiceService.validatePaymentStatus(invoiceId);
  }

  async verifyDeletionSafety(requestId: string): Promise<boolean> {
    console.log('Verifying deletion safety for request:', requestId);
    const { data, error } = await this.supabase
      .from('requests')
      .select(`
        status,
        resolution_status,
        product:products!requests_product_id_fkey (
          status
        )
      `)
      .eq('id', requestId)
      .single<RequestData>();

    console.log('Safety check data:', data);
    
    if (error || !data) {
      console.error('Safety check error:', error);
      return false;
    }

    // For active products: only allow deletion of pending requests
    if (data.product.status === 'active') {
      return data.status === 'pending';
    }
    
    // For inactive products: only allow deletion of resolved requests
    return data.resolution_status === 'resolved';
  }

  async processRequestDeletion(requestId: string): Promise<void> {
    const isSafe = await this.verifyDeletionSafety(requestId);
    if (!isSafe) {
      throw new Error('Unsafe deletion: Request has pending payments or notifications');
    }
    
    await this.supabase
      .from('requests')
      .delete()
      .eq('id', requestId);
  }

  private async broadcastStatusUpdate(requestId: string): Promise<void> {
    const { data: request } = await this.supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    await this.supabase.channel('requests')
      .send({
        type: 'broadcast',
        event: 'status_update',
        payload: { request }
      });
  }

  async setAdminProcessing(requestId: string, isProcessing: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('requests')
      .update({ admin_processing: isProcessing })
      .eq('id', requestId)

    if (error) throw error
    await this.broadcastStatusUpdate(requestId)
  }
} 