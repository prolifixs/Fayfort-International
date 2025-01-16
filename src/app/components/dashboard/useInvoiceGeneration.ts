'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/useToast'

interface InvoiceDetails {
  id: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  amount: number
  created_at: string
}

export function useInvoiceGeneration() {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  async function generateInvoice(requestId: string) {
    setLoading(true)
    try {
      // Generate invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          { 
            request_id: requestId,
            status: 'draft',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create notification
      await supabase
        .from('notifications')
        .insert([{
          type: 'invoice_ready',
          content: `Invoice #${invoice.id} has been generated`,
          reference_id: invoice.id
        }])

      return invoice
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast({
        title: 'Error generating invoice',
        description: 'Please try again later',
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    generateInvoice,
    loading
  }
} 