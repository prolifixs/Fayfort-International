'use client'

import React, { useState, useEffect } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { Database } from '../types/database.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

type Product = Database['public']['Tables']['products']['Row']

interface RequestFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: RequestFormData) => Promise<{ id: string }>
  product: Product | null
}

export type RequestFormData = {
  product_id: string
  quantity: number
  budget: number
  notes?: string
}

export default function RequestFormModal({ isOpen, onClose, onSubmit, product }: RequestFormModalProps) {
  const [formData, setFormData] = useState<RequestFormData>({
    product_id: product?.id || '',
    quantity: 1,
    budget: product?.price_range ? parseFloat(product.price_range) : 0,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState<(RequestFormData & { id: string }) | null>(null)
  const router = useRouter()

  const { products } = useProducts({
    disableRealtime: true
  })

  useEffect(() => {
    if (product?.price_range) {
      const basePrice = parseFloat(product.price_range)
      setFormData(prev => ({
        ...prev,
        budget: basePrice * prev.quantity
      }))
    }
  }, [formData.quantity, product?.price_range])

  const handleSubmit = async (values: RequestFormData): Promise<{ id: string }> => {
    try {
      console.log('RequestFormModal: Starting submission', values);
      const result = await onSubmit(values);
      console.log('RequestFormModal: Submission successful', result);
      return result;
    } catch (error) {
      console.error('RequestFormModal: Submission failed', error);
      toast.error('Failed to submit request');
      throw error;
    }
  };

  const handleViewDetails = () => {
    router.push(`/dashboard/requests/${submittedRequest?.id}`)
    setShowConfirmation(false)
    onClose()
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log('RequestFormModal: Starting form submission');
      const result = await handleSubmit(formData) as { id: string };
      console.log('RequestFormModal: Request created successfully', result);
      setSubmittedRequest({ ...formData, id: result.id });
      setShowConfirmation(true);
    } catch (error) {
      console.error('RequestFormModal: Submission failed', error);
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null

  if (showConfirmation && submittedRequest) {
    return (
      <RequestConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false)
          onClose()
        }}
        request={submittedRequest}
        onViewDetails={handleViewDetails}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">New Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a product</option>
              {products?.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Budget (Calculated)
            </label>
            <input
              type="text"
              value={`$${formData.budget.toFixed(2)}`}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md 
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RequestConfirmationDialog({ 
  isOpen, 
  onClose, 
  request, 
  onViewDetails 
}: { 
  isOpen: boolean
  onClose: () => void
  request: RequestFormData & { id: string }
  onViewDetails: () => void 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Submitted Successfully!</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Request Process Started
                </h3>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">What happens next?</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Our team will review your request</li>
              <li>You'll receive approval notification</li>
              <li>Upon approval, an invoice will be generated</li>
              <li>Complete payment to proceed with the order</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="flex space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Dismiss
          </Button>
          <Button onClick={onViewDetails}>
            View Request Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 