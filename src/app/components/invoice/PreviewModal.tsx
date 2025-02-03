'use client'

import { Dialog, DialogContent } from "@/app/components/ui/dialog"
import { PDFPreview } from './PDFPreview'
import { Invoice } from '../types/invoice'
import { X, Download } from 'lucide-react'

interface PreviewModalProps {
  invoice: Invoice | null
  isOpen: boolean
  onClose: () => void
  onDownload: (invoiceId: string) => Promise<void>
}

export function PreviewModal({ invoice, isOpen, onClose, onDownload }: PreviewModalProps) {
  console.log('PreviewModal invoice:', invoice)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => invoice && onDownload(invoice.id)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="h-[calc(80vh-4rem)]">
          {invoice && <PDFPreview invoice={invoice} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}