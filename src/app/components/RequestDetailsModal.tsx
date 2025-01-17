'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { StatusBadge } from './ui/StatusBadge'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface RequestDetails {
  id: string
  status: string
  created_at: string
  product: { name: string }
  quantity: number
  budget: number
  notes?: string
  invoice?: {
    id: string
    status: string
    amount: number
  }
}

interface RequestDetailsModalProps {
  requestId: string | null
  onClose: () => void
}

export function RequestDetailsModal({ requestId, onClose }: RequestDetailsModalProps) {
  const [details, setDetails] = useState<RequestDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails()
    }
  }, [requestId])

  async function fetchRequestDetails() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          product:products(name),
          invoice:invoices(id, status, amount)
        `)
        .eq('id', requestId)
        .single()

      if (error) throw error
      setDetails(data)
    } catch (error) {
      console.error('Error fetching request details:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!requestId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : details ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <StatusBadge status={details.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <div className="mt-1 text-sm">
                  {format(new Date(details.created_at), 'PPP')}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Product</label>
              <div className="mt-1 text-sm">{details.product.name}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Quantity</label>
                <div className="mt-1 text-sm">{details.quantity}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Budget</label>
                <div className="mt-1 text-sm">${details.budget}</div>
              </div>
            </div>

            {details.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <div className="mt-1 text-sm">{details.notes}</div>
              </div>
            )}

            {details.invoice && (
              <div className="border-t pt-4 mt-4">
                <label className="text-sm font-medium text-gray-500">Invoice</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">#{details.invoice.id}</span>
                    <StatusBadge status={details.invoice.status} />
                  </div>
                  <div className="mt-2 text-sm font-medium">
                    Amount: ${details.invoice.amount}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Request not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export type { RequestDetails } 