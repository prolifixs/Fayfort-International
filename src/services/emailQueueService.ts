import { Resend } from 'resend';
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
}

class EmailQueueService {
  private readonly QUEUE_KEY = 'email_queue';
  private readonly MAX_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5 * 60 * 1000; // 5 minutes
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.processQueue();
    }
  }

  async addToQueue(email: Omit<QueuedEmail, 'id' | 'status' | 'attempts' | 'lastAttempt' | 'createdAt'>) {
    const queue = this.getQueue();
    const newEmail: QueuedEmail = {
      ...email,
      id: crypto.randomUUID(),
      status: 'pending',
      attempts: 0,
      lastAttempt: null,
      createdAt: Date.now()
    };

    queue.push(newEmail);
    this.saveQueue(queue);
    this.processQueue();
    return newEmail.id;
  }

  private getQueue(): QueuedEmail[] {
    if (typeof window === 'undefined') return [];
    const queueData = localStorage.getItem(this.QUEUE_KEY);
    return queueData ? JSON.parse(queueData) : [];
  }

  private saveQueue(queue: QueuedEmail[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queue = this.getQueue();
      const pendingEmails = queue.filter(email => 
        email.status === 'pending' && 
        (!email.lastAttempt || Date.now() - email.lastAttempt > this.RETRY_DELAY)
      );

      for (const email of pendingEmails) {
        try {
          email.status = 'processing';
          email.attempts += 1;
          email.lastAttempt = Date.now();
          this.saveQueue(queue);

          // Initialize Resend only when needed
          const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);
          
          await resend.emails.send({
            from: 'Fayfort Enterprise <notifications@your-domain.com>',
            to: email.to,
            subject: email.subject,
            html: email.html,
            attachments: email.attachments
          });

          email.status = 'sent';
        } catch (error) {
          console.error(`Failed to send email ${email.id}:`, error);
          
          if (email.attempts >= this.MAX_ATTEMPTS) {
            email.status = 'failed';
          } else {
            email.status = 'pending';
          }
        }

        this.saveQueue(queue);
      }

      this.cleanup();
    } finally {
      this.isProcessing = false;
      
      const remainingPending = this.getQueue().some(email => email.status === 'pending');
      if (remainingPending) {
        setTimeout(() => this.processQueue(), this.RETRY_DELAY);
      }
    }
  }

  private cleanup() {
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const queue = this.getQueue();
    const activeEmails = queue.filter(email => {
      if (email.status === 'pending' || email.status === 'processing') return true;
      return Date.now() - email.createdAt < ONE_DAY;
    });

    this.saveQueue(activeEmails);
  }

  getEmailStatus(id: string): { status: QueuedEmail['status']; attempts: number } | null {
    const queue = this.getQueue();
    const email = queue.find(e => e.id === id);
    return email ? { status: email.status, attempts: email.attempts } : null;
  }
}

export const emailQueueService = new EmailQueueService(); 