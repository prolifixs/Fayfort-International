'use client'

import { useRouter } from 'next/navigation'
import { RequestDetailsModal } from '@/app/components/RequestDetailsModal'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DeleteConfirmationModal } from '@/app/components/DeleteConfirmationModal'
import { useToast } from '@/hooks/useToast'
import { useParams } from 'next/navigation'
import { RequestDetails } from '@/app/components/dashboard/UserRequestsTable'

export default function RequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteSuccess = async () => {
    toast({
      title: "Request deleted",
      description: "Your request has been successfully deleted",
      variant: "success",
    })
    router.push('/dashboard') // Redirect to dashboard after deletion
    router.refresh() // Refresh the page data
  }

  const handleDeleteRequest = async (requestId: string, canDeleteProduct: boolean) => {
    try {
      await handleDeleteSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const requestId = params.id as string

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Requests
          </Button>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Request
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <RequestDetails requestId={requestId} />
        </div>

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          requestId={requestId}
          onDeleted={handleDeleteRequest}
          itemName="Request"
        />
      </div>
    </div>
  )
} 