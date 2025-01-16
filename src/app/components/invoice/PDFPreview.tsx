'use client'

import { useState } from 'react';
import { Invoice } from '@/app/components/types/invoice';

interface PDFPreviewProps {
  invoice: Invoice;
  onDownload?: () => void;
}

export function PDFPreview({ invoice, onDownload }: PDFPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      if (onDownload) {
        await onDownload();
      } else if (invoice.pdf_url) {
        const response = await fetch(invoice.pdf_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* PDF Preview */}
      <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-gray-50">
        {invoice.pdf_url ? (
          <iframe
            src={`${invoice.pdf_url}#view=FitH`}
            className="w-full h-full"
            title={`Invoice #${invoice.id} Preview`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No PDF available
          </div>
        )}
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isLoading || !invoice.pdf_url}
        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
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
  );
} 