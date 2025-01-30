import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'payment_confirmed' 
  | 'payment_pending' 
  | 'unavailable' 
  | 'delayed' 
  | 'cancelled';
export type ProductNotificationType = 'status_change' | 'product_update' | 'system';

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

  async sendStatusUpdateNotification(requestId: string, newStatus: string): Promise<void> {
    await this.addNotification('info', `Request ${requestId} status updated to ${newStatus}`, {
      referenceType: 'request',
      productId: requestId
    });
  }

  async sendResolutionNotification(requestId: string, resolution: string): Promise<void> {
    await this.addNotification('info', `Request ${requestId} resolution updated to ${resolution}`, {
      referenceType: 'request',
      productId: requestId
    });
  }
}

export const notificationService = new NotificationService(); 