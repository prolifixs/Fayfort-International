'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { InvoiceDetail } from '@/app/components/invoice/InvoiceDetail'
import { ArrowLeft } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Invoice } from '@/app/components/types/invoice'

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const supabase = createClientComponentClient()
  const [showOrphanedDialog, setShowOrphanedDialog] = useState(false)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            request:requests(
              id,
              status,
              customer:users(email)
            )
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error
        
        if (!data.request) {
          setShowOrphanedDialog(true)
          return
        }
        
        setInvoice(data)
      } catch (error) {
        console.error('Failed to fetch invoice:', error)
      }
    }
    fetchInvoice()
  }, [params.id])

  if (!invoice) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <InvoiceDetail invoiceId={params.id} />
        </div>
      </div>
    </div>
  )
} 