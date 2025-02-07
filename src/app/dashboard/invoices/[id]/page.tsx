'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { InvoiceDetail } from '@/app/components/common/invoice/InvoiceDetail'
import { ArrowLeft } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Invoice } from '@/app/components/types/invoice'
import { StatusBadge } from '@/app/components/ui/StatusBadge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'

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
              customer:users(email),
              status_history
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
        <div className="mb-6 flex justify-between items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <StatusBadge 
            status={invoice.status} 
            type="invoice"
            showIcon
            showTimestamp
            timestamp={invoice.updated_at}
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          <InvoiceDetail invoiceId={params.id} />
        </div>
      </div>

      <Dialog open={showOrphanedDialog} onOpenChange={setShowOrphanedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Orphaned Invoice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            This invoice is not associated with any request. It may have been archived or deleted.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 