'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Invoice } from '@/app/components/types/invoice'
import { InvoiceEmail } from './templates/InvoiceEmail'

interface EmailPreviewProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice
}

export function EmailPreview({ isOpen, onClose, invoice }: EmailPreviewProps) {
  if (!invoice) return null

  // Transform invoice items to the format expected by InvoiceEmail
  const invoiceItems = invoice.invoice_items?.map(item => ({
    description: item.product?.name || 'Product',
    quantity: item.quantity || 0,
    price: item.unit_price || 0,
    total: item.total_price || 0
  })) || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Email Preview - Invoice #{invoice.id}
          </DialogTitle>
        </DialogHeader>
        <div className="border rounded-md p-4 bg-white">
          <InvoiceEmail
            customerName={invoice.request?.customer?.name || "Customer"}
            customerEmail={invoice.request?.customer?.email || "customer@example.com"}
            invoiceNumber={invoice.id}
            amount={invoice.amount}
            dueDate={invoice.due_date}
            createdAt={invoice.created_at}
            items={invoiceItems}
            paymentLink={`/dashboard/invoices/${invoice.id}`}
            status={invoice.status as "draft" | "pending" | "paid" | "overdue" | "cancelled"}
            companyName="Fayfort Enterprise"
            companyLogo="/images/logo.png" // Optional: Add your logo path
          />
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>This is a preview of the email that will be sent to the customer.</p>
          {invoice.status === 'draft' && (
            <p className="mt-2 text-amber-600">
              Note: This invoice is still in draft status. The email will be sent when the invoice is finalized.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add debug logging if needed
if (process.env.NODE_ENV === 'development') {
  EmailPreview.displayName = 'EmailPreview'
} 