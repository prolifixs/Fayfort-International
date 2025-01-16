'use client'

import { useState } from 'react'
import { Download, Mail, X } from "lucide-react"
import { formatCurrency } from "@/app/components/lib/utils"
import { Invoice } from '@/app/components/types/invoice'
import { PDFPreview } from './PDFPreview'
import { emailService } from '@/services/emailService'
import { createNotification } from '@/services/notificationService'

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [sending, setSending] = useState(false)
  
  const handleSendEmail = async () => {
    try {
      setSending(true)
      await emailService.sendInvoiceEmail(invoice, invoice.user.email)
      
      await createNotification({
        type: 'email_sent',
        content: `Invoice #${invoice.id} sent to ${invoice.user.email}`,
        reference_id: invoice.id,
        metadata: { invoice_id: invoice.id }
      })
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-x-4 top-[50%] translate-y-[-50%] max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Invoice #{invoice.id}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {showPdfPreview ? (
              <PDFPreview invoice={invoice} />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <InvoiceStatusBadge status={invoice.status} />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowPdfPreview(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview PDF
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={sending}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {sending ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                    <p className="mt-1 text-lg font-semibold">
                      {formatCurrency(invoice.amount)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
                    <p className="mt-1">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}