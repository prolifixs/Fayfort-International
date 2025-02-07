import { RequestStatus, InvoiceStatus } from '@/app/components/types/invoice'
import { notificationService, NotificationType } from './notificationService';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { InvoiceService } from '@/app/components/lib/invoice/invoiceService';
import { ShippingService } from './shippingService';

export interface StatusHistoryEntry {
  status: RequestStatus;
  timestamp: number;
  updatedBy: string;
  notes?: string;
  invoice_status?: string;
}

interface RequestStatusData {
  currentStatus: RequestStatus;
  history: StatusHistoryEntry[];
}

interface StatusMapping {
  request: RequestStatus
  invoice: InvoiceStatus
  notification: NotificationType
}

export interface ShippingInfo {
  trackingNumber: string;
  carrier: string;
  shippingDate: string;
}

// Status flow validation
const VALID_STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['fulfilled', 'rejected'],
  fulfilled: ['shipped'],
  rejected: [],
  shipped: []
};

export const STATUS_MAPPINGS: Record<RequestStatus, StatusMapping> = {
  pending: {
    request: 'pending',
    invoice: 'draft',
    notification: 'payment_pending'
  },
  approved: {
    request: 'approved',
    invoice: 'sent',
    notification: 'success'
  },
  fulfilled: {
    request: 'fulfilled',
    invoice: 'paid',
    notification: 'payment_confirmed'
  },
  rejected: {
    request: 'rejected',
    invoice: 'cancelled',
    notification: 'status_change'
  },
  shipped: {
    request: 'shipped',
    invoice: 'paid',
    notification: 'shipping_confirmed'
  }
};

export class StatusService {
  private readonly STORAGE_KEY = 'request_statuses';
  private supabase = createClientComponentClient();
  private invoiceService = new InvoiceService();
  private notificationService = notificationService;
  private shippingService = new ShippingService();

  private getStoredStatuses(): Record<string, RequestStatusData> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  getRequestStatus(requestId: string): RequestStatusData | null {
    const statuses = this.getStoredStatuses();
    return statuses[requestId] || null;
  }

  async updateStatus(
    requestId: string,
    newStatus: RequestStatus,
    updatedBy: string,
    notes?: string,
    shippingInfo?: ShippingInfo
  ): Promise<RequestStatusData> {
    console.group('🔄 Status Update Flow');
    console.log('Initial Request:', { requestId, newStatus, updatedBy });

    try {
      const currentStatus = await this.getCurrentStatus(requestId);
      const statusMapping = STATUS_MAPPINGS[newStatus];

      // Handle all updates in a single operation
      const updates = [
        // Update main request status
        this.supabase.from('requests')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId),

        // Sync invoice
        this.invoiceService.syncInvoiceStatus(requestId, newStatus),

        // Add to history
        this.supabase.from('status_history').insert({
          request_id: requestId,
          status: newStatus,
          changed_at: new Date().toISOString(),
          changed_by: updatedBy,
          notes,
          invoice_status: statusMapping.invoice
        })
      ];

      // Add shipping update if provided
      if (newStatus === 'shipped' && shippingInfo) {
        updates.push(this.shippingService.processShippingUpdate(requestId, shippingInfo));
      }

      await Promise.all(updates);

      // Send notification with correct type
      await this.notificationService.sendStatusUpdateNotification(
        requestId,
        newStatus,
        {
          previousStatus: currentStatus,
          notificationType: statusMapping.notification
        }
      );

      console.log('Status Update Completed:', { newStatus, shipping: !!shippingInfo });
      return {
        currentStatus: newStatus,
        history: await this.getStatusHistory(requestId)
      };

    } catch (error) {
      console.error('Status update failed:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  private async getCurrentStatus(requestId: string): Promise<RequestStatus> {
    const { data, error } = await this.supabase
      .from('requests')
      .select('status')
      .eq('id', requestId)
      .single();

    if (error || !data) throw new Error('Failed to get current status');
    return data.status as RequestStatus;
  }

  private validateStatusTransition(currentStatus: RequestStatus, newStatus: RequestStatus) {
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!validTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Valid transitions are: ${validTransitions.join(', ')}`
      );
    }
  }

  private async broadcastStatusUpdate(
    requestId: string,
    status: RequestStatus,
    statusMapping: StatusMapping
  ) {
    await this.supabase
      .channel('status_updates')
      .send({
        type: 'broadcast',
        event: 'STATUS_UPDATE',
        payload: {
          requestId,
          status,
          invoiceStatus: statusMapping.invoice,
          timestamp: new Date().toISOString()
        }
      });
  }

  getStatusHistory(requestId: string): StatusHistoryEntry[] {
    const data = this.getRequestStatus(requestId);
    return data?.history || [];
  }

  getStatusColor(status: RequestStatus): string {
    const colors: Record<RequestStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      fulfilled: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      shipped: 'bg-purple-100 text-purple-800'

    };
    return colors[status];
  }
}

export const statusService = new StatusService();

export type { RequestStatus };