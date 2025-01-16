'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Invoice } from '@/app/components/types/invoice'
import { useToast } from '@/hooks/useToast'
import { createNotification } from '@/app/components/lib/notifications'

export function useInvoiceStatus() {
  const [updating, setUpdating] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  async function updateStatus(invoice: Invoice, newStatus: Invoice['status']) {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoice.id)

      if (error) throw error

      // Create notification
      await createNotification({
        type: 'status_change',
        content: `Invoice #${invoice.id} status changed to ${newStatus}`,
        reference_id: invoice.id,
        metadata: {
          invoice_id: invoice.id,
          status: newStatus
        }
      })

      toast({
        title: 'Status Updated',
        description: `Invoice status changed to ${newStatus}`,
      })

      return true
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      })
      return false
    } finally {
      setUpdating(false)
    }
  }

  return {
    updateStatus,
    updating
  }
} 