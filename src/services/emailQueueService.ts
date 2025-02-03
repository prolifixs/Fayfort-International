import { EmailQueueItem } from '@/app/components/types/invoice';

interface QueuedEmail extends EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
  attempts: number;
  lastAttempt: number | null;
  status: 'pending' | 'processing' | 'failed' | 'sent';
  createdAt: number;
  error?: string;
  metadata?: Record<string, any>;
}

class EmailQueueService {
  private readonly QUEUE_KEY = 'email_queue';
  private readonly MAX_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5 * 60 * 1000; // 5 minutes
  private readonly BATCH_SIZE = 5;
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeQueue();
    }
  }

  private initializeQueue() {
    this.processQueue();
    // Process queue every 5 minutes
    setInterval(() => this.processQueue(), this.RETRY_DELAY);
  }

  async addToQueue(email: Omit<QueuedEmail, 'id' | 'status' | 'attempts' | 'lastAttempt' | 'createdAt'>) {
    try {
      const queue = this.getQueue();
      const newEmail: QueuedEmail = {
        ...email,
        id: crypto.randomUUID(),
        status: 'pending',
        attempts: 0,
        lastAttempt: null,
        createdAt: Date.now(),
        metadata: {
          addedAt: new Date().toISOString(),
          priority: email.metadata?.priority || 'normal'
        }
      };

      queue.push(newEmail);
      this.saveQueue(queue);
      this.processQueue();
      return newEmail.id;
    } catch (error) {
      console.error('Failed to add email to queue:', error);
      throw error;
    }
  }

  private getQueue(): QueuedEmail[] {
    if (typeof window === 'undefined') return [];
    try {
      const queueData = localStorage.getItem(this.QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Failed to get queue from storage:', error);
      return [];
    }
  }

  private saveQueue(queue: QueuedEmail[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
      throw error;
    }
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queue = this.getQueue();
      const pendingEmails = this.getPendingEmails(queue);

      for (const email of pendingEmails) {
        await this.processEmail(email, queue);
      }

      this.cleanup();
    } finally {
      this.isProcessing = false;
    }
  }

  private getPendingEmails(queue: QueuedEmail[]): QueuedEmail[] {
    return queue
      .filter(email => 
        email.status === 'pending' && 
        (!email.lastAttempt || Date.now() - email.lastAttempt > this.RETRY_DELAY)
      )
      .sort((a, b) => {
        const priorityA = a.metadata?.priority === 'high' ? 1 : 0;
        const priorityB = b.metadata?.priority === 'high' ? 1 : 0;
        return priorityB - priorityA;
      })
      .slice(0, this.BATCH_SIZE);
  }

  private async processEmail(email: QueuedEmail, queue: QueuedEmail[]) {
    try {
      email.status = 'processing';
      email.attempts += 1;
      email.lastAttempt = Date.now();
      this.saveQueue(queue);

      await this.sendEmail(email);

      email.status = 'sent';
      email.error = undefined;
    } catch (error) {
      this.handleEmailError(email, error);
    } finally {
      this.saveQueue(queue);
    }
  }

  private async sendEmail(email: QueuedEmail) {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email.to,
        subject: email.subject,
        html: email.html,
        attachments: email.attachments
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    return response.json();
  }

  private handleEmailError(email: QueuedEmail, error: unknown) {
    email.error = error instanceof Error ? error.message : 'Unknown error';
    
    if (email.attempts >= this.MAX_ATTEMPTS) {
      email.status = 'failed';
      this.handleFailedEmail(email);
    } else {
      email.status = 'pending';
    }
  }

  private async handleFailedEmail(email: QueuedEmail) {
    try {
      await fetch('/api/email/failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: email.id,
          error: email.error,
          attempts: email.attempts,
          metadata: email.metadata
        })
      });
    } catch (error) {
      console.error('Failed to report email failure:', error);
    }
  }

  private cleanup() {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const queue = this.getQueue();
    const activeEmails = queue.filter(email => 
      email.status === 'pending' || 
      email.status === 'processing' || 
      Date.now() - email.createdAt < ONE_DAY
    );

    if (activeEmails.length !== queue.length) {
      this.saveQueue(activeEmails);
    }
  }

  getEmailStatus(id: string) {
    const email = this.getQueue().find(e => e.id === id);
    return email ? { 
      status: email.status, 
      attempts: email.attempts,
      error: email.error 
    } : null;
  }

  async retryEmail(id: string): Promise<boolean> {
    const queue = this.getQueue();
    const email = queue.find(e => e.id === id);
    
    if (email?.status === 'failed') {
      email.status = 'pending';
      email.attempts = 0;
      email.lastAttempt = null;
      email.error = undefined;
      this.saveQueue(queue);
      this.processQueue();
      return true;
    }
    
    return false;
  }
}

export const emailQueueService = new EmailQueueService(); 