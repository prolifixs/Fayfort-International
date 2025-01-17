'use client'

import { useState, useEffect } from 'react'
import { Invoice } from '@/app/components/types/invoice'
import { pdfService } from '@/services/pdfService'
import { Loader2 } from 'lucide-react'

interface PDFPreviewProps {
  invoice: Invoice
  onDownload?: () => void
}

export function PDFPreview({ invoice, onDownload }: PDFPreviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(!invoice.pdf_url)

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      if (onDownload) {
        await onDownload()
      } else if (invoice.pdf_url) {
        const response = await fetch(invoice.pdf_url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice.id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate PDF if not already generated
  const generatePDF = async () => {
    try {
      console.log('🔄 PDFPreview: Starting PDF generation');
      setIsGenerating(true);
      const pdfUrl = await pdfService.generateAndStore(invoice);
      console.log('✅ PDFPreview: PDF generated with URL:', pdfUrl);
      invoice.pdf_url = pdfUrl;
    } catch (error) {
      console.error('❌ PDFPreview: Failed to generate PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!invoice.pdf_url && !isGenerating) {
      console.log('🚀 PDFPreview: No PDF URL found, initiating generation');
      generatePDF();
    }
  }, [invoice, isGenerating]);

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-gray-50">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="text-gray-500">Generating PDF preview...</p>
          </div>
        ) : invoice.pdf_url ? (
          <iframe
            src={`${invoice.pdf_url}#view=FitH`}
            className="w-full h-full"
            title={`Invoice #${invoice.id} Preview`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Failed to load PDF preview
          </div>
        )}
      </div>

      <button
        onClick={handleDownload}
        disabled={isLoading || !invoice.pdf_url}
        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center">
            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Downloading...
          </span>
        ) : (
          <span className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </span>
        )}
      </button>
    </div>
  )
} 