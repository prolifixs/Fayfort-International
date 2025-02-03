'use client'

import { useState, useEffect } from 'react'
import { Invoice } from '@/app/components/types/invoice'
import { pdfService } from '@/services/pdfService'
import { Loader2 } from 'lucide-react'

interface PDFPreviewProps {
  invoice: Invoice
  onDownload?: () => void
}

export function PDFPreview({ invoice }: PDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(!invoice.pdf_url)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState(invoice.pdf_url)

  useEffect(() => {
    console.log('PDFPreview mounted:', { invoice, isGenerating, pdf_url: invoice.pdf_url })
    if (!invoice.pdf_url) {
      generatePDF()
    } else {
      setPdfUrl(invoice.pdf_url)
    }
  }, [invoice])

  const generatePDF = async () => {
    try {
      setIsGenerating(true)
      const response = await fetch(`/api/invoices/${invoice.id}/preview`)
      if (!response.ok) throw new Error('Failed to fetch invoice data')
      const data = await response.json()
      
      const pdfUrl = await pdfService.generateAndStore(data)
      invoice.pdf_url = pdfUrl
      setPdfUrl(pdfUrl)
    } catch (error) {
      console.error('PDF generation failed:', error)
      setError('Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="text-gray-500">Generating PDF preview...</p>
          </div>
        ) : pdfUrl ? (
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-full"
          >
            <p>Unable to display PDF. <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Download</a> instead.</p>
          </object>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {error || 'Failed to load PDF preview'}
          </div>
        )}
      </div>
    </div>
  )
}