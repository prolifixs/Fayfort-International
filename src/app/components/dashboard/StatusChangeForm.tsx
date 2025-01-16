'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/useToast'
import { useInvoiceGeneration } from './useInvoiceGeneration'

interface StatusChangeFormProps {
  requestId: string
  currentStatus: 'request' | 'processing' | 'completed'
  onStatusChange: () => void
}

export function StatusChangeForm({ requestId, currentStatus, onStatusChange }: StatusChangeFormProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { generateInvoice, loading: invoiceLoading } = useInvoiceGeneration()

  const statusOptions = {
    request: ['processing'],
    processing: ['completed'],
    completed: []
  }

  async function handleStatusChange(newStatus: string) {
    setLoading(true)
    try {
      // Update request status
      const { error: statusError } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', requestId)

      if (statusError) throw statusError

      // If status is completed, generate invoice
      if (newStatus === 'completed') {
        const invoice = await generateInvoice(requestId)
        if (!invoice) throw new Error('Failed to generate invoice')
      }

      setStatus(newStatus as 'request' | 'processing' | 'completed')
      onStatusChange()
      
      toast({
        title: 'Status updated successfully',
        variant: 'success'
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error updating status',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium text-gray-700">Status:</span>
      <div className="relative">
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={loading || statusOptions[status].length === 0}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value={status}>{status}</option>
          {statusOptions[status].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
} 