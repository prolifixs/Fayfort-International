'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { useState } from 'react'
import { RequestProcessingService } from '@/app/components/lib/requests/requestProcessor'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import { UserRequestDeletionService } from '@/services/userRequestDeletion'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => Promise<void>
  itemName?: string
  requestId?: string
  productId?: string
  onDeleted?: (requestId: string, canDeleteProduct: boolean) => Promise<void>
  title?: string
  message?: string
}

interface RequestData {
  status: string;
  resolution_status: string;
  product: {
    status: 'active' | 'inactive';
  };
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  requestId,
  productId,
  onDeleted,
  title,
  message,
  isProductDeletion
}: DeleteConfirmationModalProps & { isProductDeletion?: boolean }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestProcessor = new RequestProcessingService()
  const deletionService = new UserRequestDeletionService()
  const supabase = createClientComponentClient()

  const handleDelete = async () => {
    if (!confirmed) return
    setIsDeleting(true)
    setError(null)
    
    try {
      if (isProductDeletion && onConfirm) {
        await onConfirm()
        onClose()
        return
      }
      
      if (requestId) {
        console.log('Checking deletion safety for request:', requestId)
        const isSafe = await requestProcessor.verifyDeletionSafety(requestId)
        console.log('Deletion safety check result:', isSafe)
        
        if (!isSafe) {
          const { data } = await supabase
            .from('requests')
            .select(`
              status,
              resolution_status,
              product:products!inner(status)
            `)
            .eq('id', requestId)
            .single<RequestData>()

          if (data?.product.status === 'active') {
            setError('Cannot delete: Only pending requests can be deleted for active products')
          } else {
            setError('Cannot delete: Request must be resolved first')
          }
          return
        }

        await deletionService.deleteRequest(requestId)
        
        if (onDeleted) {
          await onDeleted(requestId, false)
        }
        onClose()
      }
    } catch (error) {
      console.error('Delete error:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this request? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 flex flex-col items-center text-center">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded w-full">
              {error}
            </div>
          )}

          <p className="text-gray-600 mb-4">
            {message || (isProductDeletion ? 
              "Warning: This will permanently delete the product and all associated data. This action cannot be undone." :
              "Are you sure you want to delete this request? This action cannot be undone."
            )}
          </p>
          
          {!isProductDeletion && (
            <div className="mt-4 flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="confirm" className="text-sm text-gray-600">
                I confirm this request has been properly processed and notified
              </label>
            </div>
          )}

          {isProductDeletion && (
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-red-600">
                  I understand this action is irreversible and will delete all product data
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!confirmed || isDeleting}
            >
              {isDeleting ? 'Deleting...' : `Delete ${isProductDeletion ? 'Product' : 'Request'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 