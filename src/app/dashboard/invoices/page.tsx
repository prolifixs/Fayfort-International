'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { InvoiceList } from '@/app/components/common/invoice/InvoiceList'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { PaymentDialog } from '@/app/components/payment/PaymentDialog'

export default function InvoicesPage() {
  const router = useRouter()
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Subscribe to invoice updates
    const channel = supabase
      .channel('invoice_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        () => {
          // Force refresh the InvoiceList component
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const renderPaymentButton = (invoice: any) => {
    const isPaid = invoice.status !== 'draft'; // Any status other than 'draft' means payment made
    
    return (
      <Button
        onClick={() => handlePayment(invoice)}
        className={`flex-1 ${isPaid ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' : ''}`}
        disabled={isPaid}
      >
        {isPaid ? 'Paid' : 'Make Payment'}
      </Button>
    )
  }

  const handlePayment = (invoice: any) => {
    setSelectedInvoice(invoice)
    setShowPaymentDialog(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        <InvoiceList 
          renderPaymentButton={renderPaymentButton}
        />
      </div>
      {showPaymentDialog && selectedInvoice && (
        <PaymentDialog
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          invoice={selectedInvoice}
          onPaymentSuccess={() => {
            setShowPaymentDialog(false)
            setSelectedInvoice(null)
          }}
        />
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic' 