'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/useToast'
import { Download, Eye, Filter } from 'lucide-react'
import { InvoiceDetailModal } from './InvoiceDetailModal'
import { PDFPreview } from './PDFPreview'
import { createNotification, getNotificationMessage } from '@/app/components/lib/notifications'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import { useInvoiceStatus } from '@/app/hooks/useInvoiceStatus'
import { Invoice } from '../types/invoice'
import { emailService } from '@/services/emailService'
import { pdfService } from '@/services/pdfService'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react'

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { updateStatus, updating } = useInvoiceStatus()

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  async function fetchInvoices() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error fetching invoices',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  function subscribeToInvoices() {
    const channel = supabase
      .channel('invoice_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload: any) => {
          if (payload.new) {
            setInvoices(current => {
              const index = current.findIndex(inv => inv.id === payload.new.id)
              if (index >= 0) {
                const updated = [...current]
                updated[index] = payload.new as Invoice
                return updated
              }
              return [payload.new as Invoice, ...current]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  useEffect(() => {
    fetchInvoices()
    const subscription = subscribeToInvoices()
    return () => subscription()
  }, [])

  async function handleDownload(invoiceId: string) {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Create notification for download
      await createNotification({
        type: 'invoice_ready',
        content: getNotificationMessage('invoice_ready', { invoice_id: invoiceId }),
        reference_id: invoiceId,
        reference_type: 'invoice',
        metadata: { invoice_id: invoiceId }
      })

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive'
      })
    }
  }

  async function handleStatusChange(invoice: Invoice, newStatus: Invoice['status']) {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoice.id)

      if (error) throw error

      // Create notification for status change
      await createNotification({
        type: 'status_change',
        content: getNotificationMessage('status_change', { invoice_id: invoice.id, status: newStatus }),
        reference_id: invoice.id,
        reference_type: 'invoice',
        metadata: { invoice_id: invoice.id, status: newStatus }
      })

      toast({
        title: 'Success',
        description: `Invoice status updated to ${newStatus}`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update invoice status',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
        <div className="flex space-x-3">
          <button
            className="bg-white text-gray-700 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Filter
          </button>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Download All
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map(invoice => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${invoice.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => setSelectedInvoice(invoice)}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger disabled={updating}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem onClick={() => updateStatus(invoice, 'sent')}>
                            Mark as Sent
                          </DropdownMenuItem>
                        )}
                        {invoice.status === 'sent' && (
                          <DropdownMenuItem onClick={() => updateStatus(invoice, 'paid')}>
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        {['draft', 'sent'].includes(invoice.status) && (
                          <DropdownMenuItem onClick={() => updateStatus(invoice, 'cancelled')}>
                            Cancel Invoice
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
} 