'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { InvoiceDetail } from '@/app/components/invoice/InvoiceDetail'
import { PDFPreview } from '@/app/components/invoice/PDFPreview'
import { InvoiceStatusBadge } from '@/app/components/invoice/InvoiceStatusBadge'
import { ArrowLeft } from 'lucide-react'
import { Invoice } from '@/app/components/types/invoice'

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      const response = await fetch(`/api/invoices/${params.id}`)
      const data = await response.json()
      setInvoice(data)
    }
    fetchInvoice()
  }, [params.id])

  if (!invoice) return <div>Loading...</div>

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg">
          {showPdfPreview ? (
            <PDFPreview 
              invoice={invoice}
            />
          ) : (
            <InvoiceDetail 
              invoiceId={params.id}
              onPreviewClick={() => setShowPdfPreview(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
} 