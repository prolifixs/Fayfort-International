'use client'

import { useState } from 'react'
import { InvoiceEmail } from './templates/InvoiceEmail'
import { Invoice } from '@/app/components/types/invoice'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"

interface EmailPreviewProps {
  invoice: Invoice
  open: boolean
  onClose: () => void
  onSend: () => Promise<void>
}

export function EmailPreview({ invoice, open, onClose, onSend }: EmailPreviewProps) {
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    setSending(true)
    try {
      await onSend()
      onClose()
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>
        <div className="border rounded-md p-4 bg-white">
          <InvoiceEmail
            customerName={invoice.request?.customer?.name || "Customer"}
            invoiceNumber={invoice.id}
            amount={invoice.amount}
            dueDate={invoice.due_date}
            items={invoice.invoice_items.map(item => ({
              description: item.product.name,
              quantity: item.quantity,
              price: item.unit_price
            }))}
            paymentLink={`${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}`}
            status={invoice.status === 'paid' ? 'paid' : 
                   invoice.status === 'sent' ? 'pending' : 
                   invoice.status === 'failed' ? 'overdue' : 'pending'}
          />
        </div>
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 