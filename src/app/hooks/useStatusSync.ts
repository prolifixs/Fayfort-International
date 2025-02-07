import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RequestStatus, InvoiceStatus } from '@/app/components/types/invoice'
import { STATUS_MAPPINGS } from '@/services/statusService'
import type { StatusHistoryEntry } from '@/services/statusService'

interface StatusUpdate {
  requestId: string
  status: RequestStatus
  invoiceStatus: InvoiceStatus
  timestamp: string
}

export function useStatusSync(requestId?: string) {
  const [requestStatus, setRequestStatus] = useState<RequestStatus>()
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>()
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!requestId) return

    const fetchStatuses = async () => {
      try {
        const [requestData, invoiceData, historyData] = await Promise.all([
          supabase.from('requests').select('status').eq('id', requestId).single(),
          supabase.from('invoices').select('status').eq('request_id', requestId).single(),
          supabase.from('status_history')
            .select('*')
            .eq('request_id', requestId)
            .order('changed_at', { ascending: false })
        ])

        if (requestData.data) setRequestStatus(requestData.data.status)
        if (invoiceData.data) setInvoiceStatus(invoiceData.data.status)
        if (historyData.data) setStatusHistory(historyData.data)
      } catch (error) {
        console.error('Error fetching statuses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatuses()

    // Subscribe to both status and history updates
    const statusChannel = supabase.channel('status_updates')
      .on(
        'broadcast',
        { event: 'STATUS_UPDATE' },
        ({ payload }: { payload: StatusUpdate }) => {
          if (payload.requestId === requestId) {
            setRequestStatus(payload.status)
            setInvoiceStatus(payload.invoiceStatus)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'status_history',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          setStatusHistory(current => [payload.new as StatusHistoryEntry, ...current])
        }
      )
      .subscribe()

    return () => {
      statusChannel.unsubscribe()
    }
  }, [requestId, supabase])

  return {
    requestStatus,
    invoiceStatus,
    statusHistory,
    isLoading,
    statusMapping: requestStatus ? STATUS_MAPPINGS[requestStatus] : undefined
  }
} 