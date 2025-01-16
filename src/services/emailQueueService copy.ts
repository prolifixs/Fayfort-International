import { EmailQueueItem } from '@/app/components/types/invoice'

class EmailQueueService {
  private readonly QUEUE_KEY = 'email_queue'
  private readonly MAX_ATTEMPTS = 3
  private readonly RETRY_DELAY = 5 * 60 * 1000 // 5 minutes
  private isProcessing = false

  constructor() {
    // Start processing queue when service initializes
    if (typeof window !== 'undefined') {
      this.processQueue()
    }
  }

  async addToQueue(email: Omit<EmailQueueItem, 'id' | 'status' | 'attempts' | 'lastAttempt' | 'createdAt'>) {
    const queue = this.getQueue()
    const newEmail: EmailQueueItem = {
      ...email,
      id: crypto.randomUUID(),
      status: 'pending',
      attempts: 0,
      lastAttempt: null,
      createdAt: Date.now()
    }

    queue.push(newEmail)
    this.saveQueue(queue)
    this.processQueue()
  }

  private getQueue(): EmailQueueItem[] {
    if (typeof window === 'undefined') return []
    const queueData = localStorage.getItem(this.QUEUE_KEY)
    return queueData ? JSON.parse(queueData) : []
  }

  private saveQueue(queue: EmailQueueItem[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue))
  }

  private async processQueue() {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      const queue = this.getQueue()
      const pendingEmails = queue.filter(email => 
        email.status === 'pending' && 
        (email.lastAttempt === null || Date.now() - email.lastAttempt > this.RETRY_DELAY)
      )

      for (const email of pendingEmails) {
        try {
          email.status = 'processing'
          email.attempts += 1
          email.lastAttempt = Date.now()
          this.saveQueue(queue)

          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(email)
          })

          email.status = 'sent'
        } catch (error) {
          console.error(`Failed to send email ${email.id}:`, error)
          
          if (email.attempts >= this.MAX_ATTEMPTS) {
            email.status = 'failed'
          } else {
            email.status = 'pending'
          }
        }

        this.saveQueue(queue)
      }

      this.cleanup()
    } finally {
      this.isProcessing = false
      
      const remainingPending = this.getQueue().some(email => email.status === 'pending')
      if (remainingPending) {
        setTimeout(() => this.processQueue(), this.RETRY_DELAY)
      }
    }
  }

  private cleanup() {
    const queue = this.getQueue()
    const DAY = 24 * 60 * 60 * 1000
    const cleanedQueue = queue.filter(email => 
      Date.now() - email.createdAt < DAY || 
      email.status === 'pending'
    )
    this.saveQueue(cleanedQueue)
  }
}

export const emailQueueService = new EmailQueueService() 