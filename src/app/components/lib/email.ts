import { Resend } from 'resend'
import { generateInvoicePDF } from '@/app/components/lib/pdf/generateInvoicePDF'
import { InvoiceData, NotificationEmailData, Invoice } from '@/app/components/types/invoice'
import { render } from '@react-email/render'
import { InvoiceEmail } from '../email/templates/InvoiceEmail'
import { StatusChangeEmail } from '../email/templates/StatusChangeEmail'
import { WelcomeEmail } from '../email/templates/WelcomeEmail'
import { emailQueueService } from '@/services/emailQueueService'

export async function sendInvoiceEmail(invoice: Invoice) {
  const [pdfBuffer, emailHtml] = await Promise.all([
    generateInvoicePDF({
      id: invoice.id,
      status: invoice.status,
      amount: invoice.amount,
      created_at: invoice.created_at,
      due_date: invoice.due_date,
      request: invoice.request ? {
        customer: {
          name: invoice.request.customer.name,
          email: invoice.request.customer.email,
          shipping_address: invoice.request.customer.shipping_address
        }
      } : { customer: { name: '', email: '' } },
      invoices: invoice.invoice_items
    }),
    render(InvoiceEmail({ invoice, previewMode: false }))
  ])
  
  await emailQueueService.addToQueue({
    to: invoice.request?.customer?.email || 'no-reply@example.com',
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

export async function sendStatusChangeEmail(invoice: Invoice, previousStatus: 'draft' | 'sent' | 'paid' | 'cancelled') {
  const emailHtml = await render(StatusChangeEmail({ 
    invoice,
    previousStatus, 
    previewMode: false 
  }))
  
  await emailQueueService.addToQueue({
    to: invoice.request?.customer?.email || 'no-reply@example.com',
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