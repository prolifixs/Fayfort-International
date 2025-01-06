'use client'

import React from 'react'

type RequestDetailsModalProps = {
  isOpen: boolean
  onClose: () => void
  request: RequestDetails | null
}

export type RequestDetails = {
  id: number
  product: {
    name: string
    category: string
    image_url?: string
  }
  status: string
  date: string
  quantity: number
  budget: number
  customer?: {
    name: string
    email: string
  }
  status_history?: {
    status: string
    notes?: string
    created_at: string
    updated_by: {
      name: string
    }
  }[]
}

export default function RequestDetailsModal({ isOpen, onClose, request }: RequestDetailsModalProps) {
  if (!isOpen || !request) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Request Details #{request.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Details */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Product Name</p>
              <p className="mt-1 text-sm text-gray-900">{request.product.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Category</p>
              <p className="mt-1 text-sm text-gray-900">{request.product.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Quantity</p>
              <p className="mt-1 text-sm text-gray-900">{request.quantity}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Budget</p>
              <p className="mt-1 text-sm text-gray-900">${request.budget}</p>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Information</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <span className={`px-2 py-1 text-xs font-medium rounded-full
                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                ${request.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' : ''}
              `}>
                {request.status.toUpperCase()}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                Last updated: {new Date(request.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Status History */}
        {request.status_history && request.status_history.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>
            <div className="space-y-4">
              {request.status_history.map((history, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full
                        ${history.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${history.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                        ${history.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                        ${history.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' : ''}
                      `}>
                        {history.status.toUpperCase()}
                      </span>
                      <p className="mt-2 text-sm text-gray-600">{history.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(history.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {history.updated_by.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Information */}
        {request.customer && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-1 text-sm text-gray-900">{request.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-sm text-gray-900">{request.customer.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 