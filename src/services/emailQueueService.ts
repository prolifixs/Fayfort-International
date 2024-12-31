interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  attempts: number;
  lastAttempt: number | null;
  status: 'pending' | 'processing' | 'failed' | 'sent';
}

class EmailQueueService {
  private readonly STORAGE_KEY = 'email_queue';
  private readonly MAX_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds
  private isProcessing = false;

  constructor() {
    // Start processing queue when service is instantiated
    this.processQueue();
  }

  private getQueue(): QueuedEmail[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveQueue(queue: QueuedEmail[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
  }

  async addToQueue(email: Omit<QueuedEmail, 'id' | 'attempts' | 'lastAttempt' | 'status'>): Promise<string> {
    const queue = this.getQueue();
    const newEmail: QueuedEmail = {
      ...email,
      id: Math.random().toString(36).substring(2),
      attempts: 0,
      lastAttempt: null,
      status: 'pending'
    };

    queue.push(newEmail);
    this.saveQueue(queue);
    
    // Trigger queue processing
    this.processQueue();
    
    return newEmail.id;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queue = this.getQueue();
      const pendingEmails = queue.filter(email => 
        email.status === 'pending' && 
        (email.lastAttempt === null || Date.now() - email.lastAttempt > this.RETRY_DELAY)
      );

      for (const email of pendingEmails) {
        try {
          email.status = 'processing';
          email.attempts += 1;
          email.lastAttempt = Date.now();
          this.saveQueue(queue);

          // Simulate sending email
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Simulate random failure (20% chance)
          if (Math.random() < 0.2) {
            throw new Error('Simulated email sending failure');
          }

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

      // Clean up old sent/failed emails after 24 hours
      this.cleanup();
    } finally {
      this.isProcessing = false;

      // Schedule next processing if there are pending emails
      const remainingPending = this.getQueue().some(email => email.status === 'pending');
      if (remainingPending) {
        setTimeout(() => this.processQueue(), this.RETRY_DELAY);
      }
    }
  }

  private cleanup(): void {
    const ONE_DAY = 86400000; // 24 hours in milliseconds
    const queue = this.getQueue();
    const activeEmails = queue.filter(email => {
      if (email.status === 'pending' || email.status === 'processing') return true;
      if (!email.lastAttempt) return false;
      return Date.now() - email.lastAttempt < ONE_DAY;
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