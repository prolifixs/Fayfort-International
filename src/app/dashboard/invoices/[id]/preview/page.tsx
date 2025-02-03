'use client'

import { useEffect, useState } from 'react'
import { PDFPreview } from '@/app/components/invoice/PDFPreview'
import { Invoice } from '@/app/components/types/invoice'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function InvoicePreviewPage({ params }: { params: { id: string } }) {
  console.log('🟢 PreviewPage: Component mounted with params:', params)
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchInvoice = async () => {
      try {
        console.log('🟢 PreviewPage: Fetching invoice:', params.id)
        const response = await fetch(`/api/invoices/${params.id}/preview`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch invoice')
        const data = await response.json()
        
        if (mounted) {
          console.log('✅ PreviewPage: Setting invoice data:', data)
          setInvoice(data)
        }
      } catch (err) {
        console.error('🔴 PreviewPage: Error:', err)
        if (mounted) setError('Failed to load invoice')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchInvoice()
    return () => { mounted = false }
  }, [params.id])

  // Add more detailed loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p>Loading preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return invoice ? (
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
  ) : null
} 