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
      status: invoice.status === 'paid' ? 'paid' : 
              invoice.status === 'sent' ? 'pending' : 
              invoice.status === 'failed' ? 'overdue' : 
              invoice.status === 'cancelled' ? 'cancelled' : 'draft',
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
    render(InvoiceEmail({
      customerName: invoice.request?.customer?.name || 'Valued Customer',
      customerEmail: invoice.request?.customer?.email || 'no-reply@example.com',
      invoiceNumber: invoice.id,
      amount: invoice.amount,
      dueDate: invoice.due_date,
      createdAt: invoice.created_at,
      items: invoice.invoice_items.map(item => ({
        description: item.product.name,
        quantity: item.quantity,
        price: item.unit_price
      })),
      paymentLink: `/dashboard/invoices/${invoice.id}`,
      status: invoice.status === 'paid' ? 'paid' : 
              invoice.status === 'sent' ? 'pending' : 
              invoice.status === 'failed' ? 'overdue' : 
              invoice.status === 'cancelled' ? 'cancelled' : 'draft',
    }))
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

export async function sendStatusChangeEmail(invoice: Invoice, previousStatus: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'shipped') {
  const emailHtml = await render(StatusChangeEmail({ 
    customerName: invoice.request?.customer?.name || 'Customer',
    requestId: invoice.request_id,
    previousStatus,
    newStatus: invoice.status === 'paid' ? 'fulfilled' :
               invoice.status === 'sent' ? 'approved' :
               invoice.status === 'cancelled' ? 'rejected' : 'pending',
    actionLink: `/dashboard/requests/${invoice.request_id}`
  }))
  
  await emailQueueService.addToQueue({
    to: invoice.request?.customer?.email || 'no-reply@example.com',
    subject: `Invoice #${invoice.id} Status Updated`,
    html: emailHtml
  })
}

export async function sendWelcomeEmail(name: string, email: string) {
  const emailHtml = await render(WelcomeEmail({ 
    userName: name,
    verificationLink: '/verify' // Required by WelcomeEmailProps
  }))
  
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