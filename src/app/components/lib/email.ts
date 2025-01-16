import { Resend } from 'resend'
import { generateInvoicePDF } from '@/app/components/lib/pdf/generateInvoicePDF'
import { InvoiceData, NotificationEmailData } from '@/app/components/types/invoice'
import { render } from '@react-email/render'
import { InvoiceEmail } from '../email/templates/InvoiceEmail'
import { StatusChangeEmail } from '../email/templates/StatusChangeEmail'
import { WelcomeEmail } from '../email/templates/WelcomeEmail'
import { emailQueueService } from '@/services/emailQueueService'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvoiceEmail(invoice: InvoiceData) {
  const [pdfBuffer, emailHtml] = await Promise.all([
    generateInvoicePDF(invoice),
    render(InvoiceEmail({ invoice, previewMode: false }))
  ])
  
  await emailQueueService.addToQueue({
    to: invoice.request.customer.email,
    subject: `Invoice #${invoice.id} from Your Company`,
    html: emailHtml,
    attachments: [
      {
        filename: `invoice-${invoice.id}.pdf`,
        content: pdfBuffer
      }
    ]
  })
}

export async function sendStatusChangeEmail(invoice: InvoiceData, previousStatus: 'draft' | 'sent' | 'paid' | 'cancelled') {
  const emailHtml = await render(StatusChangeEmail({ 
    invoice, 
    previousStatus, 
    previewMode: false 
  }))
  
  await emailQueueService.addToQueue({
    to: invoice.request.customer.email,
    subject: `Invoice #${invoice.id} Status Updated`,
    html: emailHtml
  })
}

export async function sendWelcomeEmail(name: string, email: string) {
  const emailHtml = await render(WelcomeEmail({ name, previewMode: false }))
  
  await emailQueueService.addToQueue({
    to: email,
    subject: 'Welcome to Our Platform!',
    html: emailHtml
  })
}

export async function sendNotificationEmail({
  to,
  subject,
  content
}: NotificationEmailData) {
  await emailQueueService.addToQueue({
    to,
    subject,
    html: `
      <h2>${subject}</h2>
      <p>${content}</p>
      <p>Log in to your account to view more details.</p>
    `
  })
} 