import { RequestStatus } from "@/app/components/types/request.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { EmailService } from "@/services/emailService";

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'payment_confirmed' 
  | 'payment_pending' 
  | 'unavailable' 
  | 'delayed' 
  | 'cancelled'
  | 'status_change'
  | 'shipping_confirmed';
export type ProductNotificationType = NotificationType | 'product_update' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

export class NotificationService {
  private readonly STORAGE_KEY = 'notifications';
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private supabase = createClientComponentClient();
  private emailService = new EmailService();

  private getNotifications(): Notification[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    this.notifyListeners(notifications);
  }

  async addNotification(type: NotificationType, message: string, options?: {
    productId?: string;
    referenceType?: string;
  }): Promise<void> {
    const localNotification: Notification = {
      id: Math.random().toString(36).substring(2),
      type,
      message,
      timestamp: Date.now(),
      read: false
    };
    this.saveNotifications([localNotification, ...this.getNotifications()]);

    if (options?.productId) {
      await this.createNotification({
        type: type as string,
        content: message,
        reference_id: options.productId,
        reference_type: options.referenceType || 'product'
      });
    }
  }

  markAsRead(notificationId: string): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    this.saveNotifications(updated);
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(notifications: Notification[]): void {
    this.listeners.forEach(listener => listener(notifications));
  }

  async createStatusChangeNotification(
    productId: string,
    oldStatus: 'active' | 'inactive',
    newStatus: 'active' | 'inactive',
    productName: string
  ) {
    const message = `Product "${productName}" status changed from ${oldStatus} to ${newStatus}`;
    
    await this.addNotification('info', message, {
      productId,
      referenceType: 'product'
    });
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError!;
  }

  async createNotification(notification: {
    type: string;
    content: string;
    reference_id: string;
    reference_type: string;
    metadata?: Record<string, any>;
  }) {
    return this.retryOperation(async () => {
      const { data: user } = await this.supabase.auth.getUser();
      
      return await this.supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.user?.id,
          read_status: false,
          created_at: new Date().toISOString()
        });
    });
  }

  async sendStatusUpdateNotification(
    requestId: string,
    newStatus: RequestStatus,
    options: {
      previousStatus?: RequestStatus;
      productName?: string;
    }
  ) {
    const DEBUG = true;
    const debugLog = (group: string, data: any) => {
      if (DEBUG) {
        console.group(`🔍 ${group}`);
        console.log(data);
        console.groupEnd();
      }
    };

    debugLog('Notification Service Started', {
      requestId,
      newStatus,
      options
    });

    try {
      // Fetch request
      const { data: request, error: requestError } = await this.supabase
        .from('requests')
        .select('id, customer_id, product_id')
        .eq('id', requestId)
        .single();

      debugLog('Request Fetch Result', {
        success: !requestError,
        request,
        error: requestError
      });

      if (requestError || !request) {
        debugLog('Request Fetch Failed', { requestId, error: requestError });
        return;
      }

      // Fetch related data
      const [userResult, productResult] = await Promise.all([
        this.supabase
          .from('users')
          .select('email')
          .eq('id', request.customer_id)
          .single(),
        this.supabase
          .from('products')
          .select('name')
          .eq('id', request.product_id)
          .single()
      ]);

      debugLog('Related Data Fetch', {
        hasUserEmail: Boolean(userResult.data?.email),
        hasProductName: Boolean(productResult.data?.name),
        userError: userResult.error,
        productError: productResult.error
      });

      const emailContent = this.getEmailContentForStatus(
        newStatus,
        options.productName || productResult.data?.name,
        options.previousStatus
      );

      debugLog('Email Content Generated', {
        subject: emailContent.subject,
        hasMessage: Boolean(emailContent.message)
      });

      await this.emailService.sendNotificationEmail(
        userResult.data?.email,
        emailContent.subject,
        emailContent.message
      );

      debugLog('Email Service Called', {
        recipient: userResult.data?.email,
        subject: emailContent.subject
      });

      // Create notification record
      await this.createNotification({
        type: 'status_change',
        content: emailContent.message,
        reference_id: requestId,
        reference_type: 'request',
        metadata: {
          previousStatus: options.previousStatus,
          newStatus,
          productName: options.productName || productResult.data?.name
        }
      });

      debugLog('Notification Record Created', {
        requestId,
        type: 'status_change'
      });

    } catch (error) {
      debugLog('Notification Service Error', {
        requestId,
        newStatus,
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private getEmailContentForStatus(
    status: RequestStatus,
    productName: string,
    previousStatus?: RequestStatus
  ) {
    const statusMessages = {
      pending: {
        subject: 'Request Received',
        message: `Your request for ${productName} is being reviewed`
      },
      approved: {
        subject: 'Request Approved',
        message: `Your request for ${productName} has been approved`
      },
      fulfilled: {
        subject: 'Request Fulfilled',
        message: `Your request for ${productName} has been fulfilled`
      },
      shipped: {
        subject: 'Order Shipped',
        message: `Your order for ${productName} is on its way`
      },
      rejected: {
        subject: 'Request Status Update',
        message: `There was an update to your request for ${productName}`
      }
    };

    return statusMessages[status] || {
      subject: 'Request Status Update',
      message: `Status for ${productName} changed from ${previousStatus} to ${status}`
    };
  }

  // Add a method to handle request-specific notifications
  async createRequestNotification(data: {
    type: 'status_change' | 'request_created' | 'request_updated';
    requestId: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    const { data: user } = await this.supabase.auth.getUser();
    
    return this.retryOperation(async () => {
      return await this.supabase
        .from('notifications')
        .insert({
          type: data.type,
          content: data.message,
          reference_id: data.requestId,
          reference_type: 'request',
          user_id: user.user?.id,
          metadata: data.metadata,
          read_status: false,
          created_at: new Date().toISOString()
        });
    });
  }

  // Add new methods for payment notifications
  async sendPaymentNotification(
    requestId: string,
    type: 'payment_confirmed' | 'payment_pending' | 'payment_failed',
    paymentDetails: {
      amount: number;
      invoiceId: string;
      paymentId?: string;
    }
  ) {
    try {
      const { data: request } = await this.supabase
        .from('requests')
        .select(`
          *,
          customer:users!inner(email, name),
          product:products!inner(name)
        `)
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Request not found');

      const emailContent = this.getPaymentEmailContent(type, paymentDetails);

      // Use existing email service
      await this.emailService.sendNotificationEmail(
        request.customer.email,
        emailContent.subject,
        emailContent.message
      );

      // Log using existing mechanism
      await this.createNotification({
        type,
        content: emailContent.message,
        reference_id: requestId,
        reference_type: 'payment',
        metadata: paymentDetails
      });

    } catch (error) {
      console.error('Payment notification failed:', error);
      throw error;
    }
  }

  // Add shipping notification handler
  async sendShippingNotification(
    requestId: string,
    shippingDetails: {
      trackingNumber: string;
      carrier: string;
      estimatedDelivery: string;
    }
  ) {
    try {
      const { data: request } = await this.supabase
        .from('requests')
        .select(`
          *,
          customer:users!inner(email, name),
          product:products!inner(name)
        `)
        .eq('id', requestId)
        .single();

      if (!request) throw new Error('Request not found');

      const emailContent = {
        subject: 'Your Order Has Been Shipped',
        message: `Your order for ${request.product.name} has been shipped via ${shippingDetails.carrier}. Tracking number: ${shippingDetails.trackingNumber}`
      };

      await this.emailService.sendNotificationEmail(
        request.customer.email,
        emailContent.subject,
        emailContent.message
      );

      await this.createNotification({
        type: 'shipping_confirmed',
        content: emailContent.message,
        reference_id: requestId,
        reference_type: 'shipping',
        metadata: shippingDetails
      });

    } catch (error) {
      console.error('Shipping notification failed:', error);
      throw error;
    }
  }

  private getPaymentEmailContent(
    type: 'payment_confirmed' | 'payment_pending' | 'payment_failed',
    details: { amount: number; invoiceId: string }
  ) {
    const templates = {
      payment_confirmed: {
        subject: 'Payment Confirmed',
        message: `Your payment of $${details.amount} for invoice #${details.invoiceId} has been confirmed.`
      },
      payment_pending: {
        subject: 'Payment Processing',
        message: `Your payment of $${details.amount} for invoice #${details.invoiceId} is being processed.`
      },
      payment_failed: {
        subject: 'Payment Failed',
        message: `Your payment of $${details.amount} for invoice #${details.invoiceId} could not be processed.`
      }
    };

    return templates[type];
  }
}

export const notificationService = new NotificationService(); 