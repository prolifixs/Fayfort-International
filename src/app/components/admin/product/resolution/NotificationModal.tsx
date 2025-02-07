'use client'

import { Dialog } from '@headlessui/react'
import { useState } from 'react'
import type { Product } from '@/app/components/admin/ProductTable/types'
import { supabase } from '@/app/components/lib/supabase'
import { notificationService } from '@/services/notificationService'
import { toast } from 'react-hot-toast'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (requestId: string) => Promise<void>
  selectedRequests: string[]
  product: Product
  processing: boolean
}

export function NotificationModal({
  isOpen,
  onClose,
  onConfirm,
  selectedRequests,
  product,
  processing
}: NotificationModalProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const presetMessages = {
    unavailable: `We regret to inform you that ${product.name} is currently unavailable.`,
    discontinued: `${product.name} has been discontinued from our product line.`,
    outOfStock: `${product.name} is temporarily out of stock.`
  }

  const handlePresetMessage = (type: keyof typeof presetMessages) => {
    setMessage(presetMessages[type])
  }

  const handleSubmit = async () => {
    try {
      setSending(true)
      
      // Update status and send notifications
      await Promise.all(selectedRequests.map(async (requestId) => {
        // Update status to notified
        await onConfirm(requestId)  // This calls handleStatusChange

        // Send notification
        await notificationService.createNotification({
          type: 'product_status',
          content: message,
          reference_id: product.id,
          reference_type: 'product'
        })
      }))

      toast.success('Notifications sent successfully')
      onClose()
    } catch (error) {
      console.error('Error sending notifications:', error)
      toast.error('Failed to send notifications')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="text-lg font-medium mb-4">
            Send Notification
          </Dialog.Title>

          <div className="space-y-4">
            {/* Preset Message Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handlePresetMessage('unavailable')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Unavailable
              </button>
              <button
                onClick={() => handlePresetMessage('discontinued')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Discontinued
              </button>
              <button
                onClick={() => handlePresetMessage('outOfStock')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Out of Stock
              </button>
            </div>

            {/* Email Checkbox (disabled for now) */}
            <div className="flex items-center">
              <input
                type="checkbox"
                disabled
                className="h-4 w-4 text-indigo-600 rounded border-gray-300"
              />
              <label className="ml-2 text-sm text-gray-500">
                Also send via email (coming soon)
              </label>
            </div>

            {/* Existing Message Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={4}
                placeholder="Enter notification message..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!message || sending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 