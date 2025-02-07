'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { useToast } from '@/app/components/ui/use-toast'
import { RequestStatus } from '@/app/components/types/invoice'
import { RequestProcessingService } from '@/app/components/lib/requests/requestProcessor'
import { StatusBadge } from '@/app/components/ui/status/StatusBadge'
import { NotificationType } from '@/services/notificationService'

interface StatusChangeFormProps {
  requestId: string
  currentStatus: RequestStatus
  onStatusChange: () => void
  disabled?: boolean
}

const statusChangeMap: Record<RequestStatus, { notificationType: 'request' | 'resolution' }> = {
  pending: { notificationType: 'request' },
  approved: { notificationType: 'request' },
  fulfilled: { notificationType: 'request' },
  shipped: { notificationType: 'request' },
  notified: { notificationType: 'resolution' },
  resolved: { notificationType: 'resolution' },
  rejected: { notificationType: 'request' }
}



export function StatusChangeForm({ 
  requestId, 
  currentStatus, 
  onStatusChange,
  disabled = false 
}: StatusChangeFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const requestProcessor = new RequestProcessingService()

  // Define available status transitions
  const statusOptions: Record<RequestStatus, RequestStatus[]> = {
    pending: ['approved'],
    approved: ['fulfilled'],
    fulfilled: ['shipped'],
    shipped: [],
    notified: [],
    resolved: [],
    rejected: []
  }



  const nextStatuses = statusOptions[currentStatus] || []

  async function handleStatusChange(newStatus: RequestStatus) {
    setLoading(true)
    try {
      const context = statusChangeMap[newStatus];
      await requestProcessor.updateRequestStatus(
        requestId, 
        newStatus, 
        context.notificationType
      )
      
      onStatusChange()
      toast({
        title: 'Status updated',
        description: `Request status changed to ${newStatus}`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Status update failed:', error)
      toast({
        title: 'Update failed',
        description: 'Could not update the status. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Current Status:</span>
        <StatusBadge status={currentStatus} type="request" />
      </div>
      
      {nextStatuses.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Change Status To:</span>
          <div className="flex gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={loading || disabled}
                variant="outline"
                size="sm"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground">
          Updating status...
        </div>
      )}
    </div>
  )
} 