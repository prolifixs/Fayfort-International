'use client'

import { useState, useEffect } from 'react'
import { ResolutionTable } from './ResolutionTable'
import { NotificationModal } from './NotificationModal'
import { DeleteConfirmationModal } from '@/app/components/DeleteConfirmationModal'
import type { Product } from '@/app/components/ProductTable/types'
import type { Request as DatabaseRequest } from '@/app/components/types/database.types'
import { toast } from 'react-hot-toast'
import { RequestProcessingService } from '@/app/components/lib/requests/requestProcessor'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabase } from '../../lib/supabase'

interface ResolutionViewProps {
  product: Product & {
    requests: Array<DatabaseRequest & {
      invoice_status: string
      resolution_status: string
      notification_sent: boolean
    }>
  }
  onStatusChange: (productId: string, newStatus: 'active' | 'inactive') => Promise<void>
}

export function ResolutionView({ product, onStatusChange }: ResolutionViewProps) {
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [selectedRequestForDeletion, setSelectedRequestForDeletion] = useState<string | undefined>(undefined)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [filteredRequests, setFilteredRequests] = useState(product.requests)
  const requestProcessor = new RequestProcessingService()
  const router = useRouter()
  const [requests, setRequests] = useState<DatabaseRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [invoiceFilter, setInvoiceFilter] = useState<string>('all')

  const [isBulkCleanupModalOpen, setIsBulkCleanupModalOpen] = useState(false)
  const [isProductDeleteModalOpen, setIsProductDeleteModalOpen] = useState(false)

  useEffect(() => {
    async function fetchRequests() {
      try {
        const response = await fetch(`/api/products/${product.id}/requests`)
        if (!response.ok) throw new Error('Failed to fetch requests')
        const data = await response.json()
        setRequests(data)
      } catch (error) {
        console.error('Error fetching requests:', error)
        toast.error('Failed to load requests')
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [product.id])

  useEffect(() => {
    filterRequests()
  }, [statusFilter, invoiceFilter, product.requests])

  useEffect(() => {
    const subscription = supabase
      .channel('request-deletions')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'requests',
          filter: `product_id=eq.${product.id}`
        },
        (payload) => {
          // Remove deleted request from state
          setRequests(prev => prev.filter(req => req.id !== payload.old.id))
          toast('A request has been deleted by the user', {
            icon: 'ℹ️'
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [product.id])

  const filterRequests = () => {
    let filtered = product.requests

    if (statusFilter !== 'all') {
      filtered = filtered.filter((req: DatabaseRequest) => req.resolution_status === statusFilter)
    }

    if (invoiceFilter !== 'all') {
      filtered = filtered.filter((req: DatabaseRequest) => req.invoice_status === invoiceFilter)
    }

    setFilteredRequests(filtered)
  }

  const handleNotify = async () => {
    setProcessing(true)
    try {
      // Set admin_processing flag for all selected requests
      await Promise.all(
        selectedRequests.map(requestId =>
          requestProcessor.setAdminProcessing(requestId, true)
        )
      )

      // Send notifications and update resolution status
      await Promise.all(
        selectedRequests.map(requestId =>
          requestProcessor.sendNotifications(requestId, 'unavailable')
        )
      )
      
      // Update UI status for selected requests
      await Promise.all(
        selectedRequests.map(requestId =>
          requestProcessor.updateRequestStatus(requestId, 'notified', 'resolution')
        )
      )
      
      toast.success('Notifications sent successfully')
      setIsNotifyModalOpen(false)
      setSelectedRequests([])
    } catch (error) {
      console.error('Notification error:', error)
      toast.error('Failed to send notifications')
    } finally {
      // Clear admin_processing flag
      await Promise.all(
        selectedRequests.map(requestId =>
          requestProcessor.setAdminProcessing(requestId, false)
        )
      )
      setProcessing(false)
    }
  }

  const handleStatusUpdate = async (newStatus: 'active' | 'inactive') => {
    try {
      setStatusUpdating(true)
      if (newStatus === 'inactive') {
        const unpaidRequests = product.requests.filter((req: DatabaseRequest) => req.invoice_status !== 'paid')
        if (unpaidRequests.length > 0) {
          await Promise.all(
            unpaidRequests.map((request: DatabaseRequest) => 
              requestProcessor.processUnpaidRequest(request.id)
            )
          )
        }
      }
      await onStatusChange(product.id, newStatus)
      toast.success(`Product status updated to ${newStatus}`)
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update product status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleRequestDeleted = async (requestId: string) => {
    try {
      console.log('Starting deletion check for request:', requestId)
      const request = requests.find(r => r.id === requestId)
      if (!request) {
        console.log('Request not found in state:', requestId)
        return
      }

      // Check if request is already deleted
      const { data: existingRequest, error } = await supabase
        .from('requests')
        .select('id')
        .eq('id', requestId)
        .single()

      console.log('Supabase check result:', { existingRequest, error })

      if (!existingRequest) {
        console.log('Request already deleted, updating state')
        setRequests(prev => prev.filter(r => r.id !== requestId))
        toast('Request was already deleted by the user', {
          icon: 'ℹ️'
        })
        return
      }

      setSelectedRequestForDeletion(requestId)
      setIsDeleteModalOpen(true)
    } catch (error) {
      console.error('Request deletion error:', error)
      toast.error('Failed to process request deletion')
    }
  }

  const handleBulkCleanup = async () => {
    setProcessing(true)
    try {
      const unpaidRequests = product.requests.filter(
        (req: DatabaseRequest) => 
          req.invoice_status === 'unpaid' && 
          req.resolution_status === 'notified'
      )
      
      if (unpaidRequests.length === 0) {
        toast.error('No eligible requests for cleanup')
        return
      }

      await Promise.all(
        unpaidRequests.map((request: DatabaseRequest) => 
          requestProcessor.processUnpaidRequest(request.id)
        )
      )

      const remainingRequests = await requestProcessor.getActiveRequestCount(product.id)
      if (remainingRequests === 0) {
        setIsProductDeleteModalOpen(true)
      } else {
        toast.success(`Cleaned up ${unpaidRequests.length} requests. ${remainingRequests} remaining.`)
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      toast.error('Failed to process cleanup')
    } finally {
      setProcessing(false)
      setIsBulkCleanupModalOpen(false)
    }
  }

  const handleProductDeletion = async () => {
    if (!product?.id) {
      toast.error('Invalid product ID')
      return
    }
    
    setStatusUpdating(true)
    try {
      const response = await fetch(`/api/products/${product.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const responseText = await response.text()
        let errorMessage = 'Failed to delete product'
        
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = responseText
        }
        
        throw new Error(errorMessage)
      }
      
      toast.success('Product deleted successfully')
      router.push('/admin/catalog')
    } catch (error) {
      console.error('Product deletion error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleSelectRequest = (requestIds: string) => {
    if (requestIds.includes(',')) {
      // Bulk selection
      setSelectedRequests(requestIds.split(','));
    } else if (requestIds === '') {
      // Deselect all
      setSelectedRequests([]);
    } else {
      // Single selection/deselection
      setSelectedRequests(prev => 
        prev.includes(requestIds) 
          ? prev.filter(id => id !== requestIds)
          : [...prev, requestIds]
      );
    }
  };

  const handleStatusChange = async (requestId: string, type: 'resolution' | 'invoice', status: string) => {
    try {
      setProcessing(true)
      if (type === 'resolution') {
        await requestProcessor.updateRequestStatus(requestId, status, type, 'info')
      } else {
        await requestProcessor.updateRequestStatus(
          requestId, 
          status, 
          type,
          status === 'paid' ? 'payment_confirmed' : 'payment_pending'
        )
      }
      updateRequestStatus(requestId, type, status)
      toast.success('Status updated successfully')
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update status')
    } finally {
      setProcessing(false)
    }
  }

  const updateRequestStatus = (requestId: string, type: 'resolution' | 'invoice', newStatus: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          [type === 'resolution' ? 'resolution_status' : 'invoice_status']: newStatus
        }
      }
      return req
    }))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Resolution: {product.name}</h2>
            <div className="flex items-center gap-2">
              <Badge variant={product.status === 'active' ? 'default' : 'destructive'}>
                {product.status}
              </Badge>
              <span className="text-sm text-gray-500">
                {product.requests.length} pending requests
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate(product.status === 'active' ? 'inactive' : 'active')}
              disabled={statusUpdating}
            >
              {statusUpdating ? 'Updating...' : `Mark ${product.status === 'active' ? 'Inactive' : 'Active'}`}
            </Button>
            <Button
              variant="default"
              onClick={() => setIsNotifyModalOpen(true)}
              disabled={selectedRequests.length === 0 || processing}
            >
              {processing ? 'Processing...' : `Notify Selected (${selectedRequests.length})`}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsBulkCleanupModalOpen(true)}
              disabled={processing || !product.requests.some(
                (req: DatabaseRequest) => req.invoice_status === 'unpaid' && req.resolution_status === 'notified'
              )}
            >
              {processing ? 'Processing...' : 'Cleanup Unpaid Requests'}
            </Button>
            {product.requests.length === 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsProductDeleteModalOpen(true)}
                disabled={statusUpdating}
              >
                {statusUpdating ? 'Deleting...' : 'Delete Product'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="notified">Notified</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={invoiceFilter}
            onChange={(e) => setInvoiceFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5"
          >
            <option value="all">All Invoices</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <ResolutionTable
            requests={requests}
            selectedRequests={selectedRequests}
            onSelectRequest={handleSelectRequest}
            onDeleteRequest={handleRequestDeleted}
            onStatusChange={handleStatusChange}
            productId={product.id}
          />
        )}
      </div>

      <NotificationModal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
        onConfirm={handleNotify}
        selectedRequests={selectedRequests}
        product={product}
        processing={processing}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedRequestForDeletion(undefined)
        }}
        itemName={selectedRequestForDeletion ? `Request ${selectedRequestForDeletion}` : ''}
        requestId={selectedRequestForDeletion}
        productId={product.id}
        onDeleted={async (requestId) => {
          await requestProcessor.processRequestDeletion(requestId)
          setRequests(prev => prev.filter(req => req.id !== requestId))
          toast.success('Request deleted successfully')
          setIsDeleteModalOpen(false)
        }}
      />

      <DeleteConfirmationModal
        isOpen={isBulkCleanupModalOpen}
        onClose={() => setIsBulkCleanupModalOpen(false)}
        onConfirm={handleBulkCleanup}
        title="Confirm Bulk Cleanup"
        message="Are you sure you want to clean up all unpaid and notified requests? This action cannot be undone."
      />

      <DeleteConfirmationModal
        isOpen={isProductDeleteModalOpen}
        onClose={() => setIsProductDeleteModalOpen(false)}
        onConfirm={handleProductDeletion}
        title="Delete Product"
        message="Warning: This will permanently delete the product and all associated data."
        itemName={product.name}
        isProductDeletion={true}
      />
    </div>
  )
} 