import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

class NotificationService {
  private readonly STORAGE_KEY = 'notifications';
  private listeners: ((notifications: Notification[]) => void)[] = [];

  private getNotifications(): Notification[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    this.notifyListeners(notifications);
  }

  addNotification(type: NotificationType, message: string): void {
    const notifications = this.getNotifications();
    const newNotification: Notification = {
      id: Math.random().toString(36).substring(2),
      type,
      message,
      timestamp: Date.now(),
      read: false
    };

    this.saveNotifications([newNotification, ...notifications]);
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
}

export const notificationService = new NotificationService(); 

export async function createNotification(notification: {
  type: string;
  content: string;
  reference_id: string;
  reference_type: string;
}) {
  const supabase = createClientComponentClient();
  const { data: user } = await supabase.auth.getUser();
  
  return await supabase
    .from('notifications')
    .insert({
      ...notification,
      user_id: user.user?.id,
      read_status: false,
      created_at: new Date().toISOString()
    });
} 