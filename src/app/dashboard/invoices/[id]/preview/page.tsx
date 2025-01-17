'use client'

import { useEffect, useState } from 'react'
import { PDFPreview } from '@/app/components/invoice/PDFPreview'
import { Invoice } from '@/app/components/types/invoice'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function InvoicePreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}/preview`)
        if (!response.ok) throw new Error('Failed to fetch invoice')
        const data = await response.json()
        console.log('📥 Preview: Fetched invoice data:', data)
        setInvoice(data)
      } catch (error) {
        console.error('Failed to fetch invoice:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [params.id])

  if (loading || !invoice) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Invoice
          </button>
        </div>
        <PDFPreview invoice={invoice} />
      </div>
    </div>
  )
} 