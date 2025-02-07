import PDFDocument from 'pdfkit'
import { renderToStream } from '@react-pdf/renderer'
import { InvoicePDF } from './pdf/InvoicePDF'
import type { InvoiceData, InvoiceItem } from '../types/invoice'

// PDFKit implementation for server-side generation
export async function generatePDFKit(rawInvoice: any): Promise<Buffer> {
  const invoice = transformInvoiceData(rawInvoice)
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      // Header
      doc
        .fontSize(20)
        .text('INVOICE', { align: 'center' })
        .moveDown()

      // Status Badge
      doc
        .fontSize(12)
        .fillColor(getStatusColor(invoice.status))
        .text(invoice.status.toUpperCase(), { align: 'right' })
        .fillColor('#000000')
        .moveDown()

      // Invoice Details
      doc
        .fontSize(12)
        .text(`Invoice #: ${invoice.id}`)
        .text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`)
        .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`)
        .moveDown()

      // Billing Information
      doc
        .text('Bill To:')
        .text(invoice.request.customer.name)
        .text(invoice.request.customer.email)
        .text(invoice.request.customer.shipping_address?.street_address || '')
        .text(`${invoice.request.customer.shipping_address?.city}, ${invoice.request.customer.shipping_address?.state} ${invoice.request.customer.shipping_address?.postal_code}`)
        .text(invoice.request.customer.shipping_address?.country || '')
        .moveDown()

      // Items Table
      const tableTop = doc.y + 20
      
      // Table Headers
      doc.fontSize(12).fillColor('#000000')
      const headers = ['Item', 'Quantity', 'Unit Price', 'Total']
      const columnWidth = 150
      headers.forEach((header, i) => {
        doc.text(header, 50 + (i * columnWidth), tableTop)
      })

      // Table Rows
      doc.fontSize(10).fillColor('#000000')
      let rowTop = tableTop + 25

      invoice.invoices.forEach((item: InvoiceItem) => {
        doc
          .text(item.product.name, 50, rowTop)
          .text(item.quantity.toString(), 50 + columnWidth, rowTop)

          .text(`$${item.unit_price.toFixed(2)}`, 50 + (columnWidth * 2), rowTop)
          .text(`$${item.total_price.toFixed(2)}`, 50 + (columnWidth * 3), rowTop)
        
        rowTop += 20
      })

      // Total
      doc
        .moveDown(2)
        .fontSize(14)
        .fillColor('#000000')
        .text(`Total Amount: $${invoice.amount.toFixed(2)}`, { align: 'right' })

      // Footer
      doc
        .moveDown(2)
        .fontSize(10)
        .fillColor('#000000')
        .text('Thank you for your business!', { align: 'center' })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// React-PDF implementation for client-side preview
export async function generateReactPDF(invoice: InvoiceData): Promise<Buffer> {
  const stream = await renderToStream(InvoicePDF({ invoice }));
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Uint8Array) => chunks.push(Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

// Helper function to get status colors
function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return '#9CA3AF'
    case 'sent': return '#60A5FA'
    case 'paid': return '#34D399'
    case 'cancelled': return '#EF4444'
    default: return '#000000'
  }
}

// Add this transformer function
function transformInvoiceData(invoice: any): InvoiceData {
  return {
    ...invoice,
    invoice_items: invoice.items || [],
    request: {
      customer: {
        name: invoice.user?.name || '',
        email: invoice.user?.email || '',
        shipping_address: invoice.user?.shipping_address
      }
    }
  };
}

// Default export for backward compatibility
export const generateInvoicePDF = generatePDFKit