'use client'

import React, { useState, useMemo } from 'react'
import RequestFormModal, { RequestFormData } from '../components/RequestFormModal'
import RequestDetailsModal, { RequestDetails } from '../components/RequestDetailsModal'
import { useRequests, Request } from '../hooks/useRequests'
import LoadingSpinner from '../components/LoadingSpinner'

type RequestStatus = 'all' | 'pending' | 'approved' | 'fulfilled' | 'rejected'

export default function RequestPage() {
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus>('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RequestDetails | null>(null)

  const requestOptions = useMemo(() => ({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    startDate: dateRange.from,
    endDate: dateRange.to
  }), [selectedStatus, dateRange.from, dateRange.to])

  const { requests, stats, loading, error, createRequest } = useRequests(requestOptions)

  const handleNewRequest = async (data: RequestFormData) => {
    try {
      await createRequest(data)
      setIsModalOpen(false)
    } catch (err) {
      console.error('Failed to create request:', err)
    }
  }

  const handleViewDetails = (request: Request) => {
    const details: RequestDetails = {
      id: Number(request.id),
      product: {
        name: request.product.name,
        category: request.product.category
      },
      status: request.status,
      date: request.created_at,
      quantity: request.quantity,
      budget: request.budget,
      customer: request.customer,
      status_history: request.status_history.map(history => ({
        status: history.status,
        notes: history.notes,
        created_at: history.created_at,
        updated_by: history.updated_by
      }))
    }
    setSelectedRequest(details)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Requests
          </h1>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => setIsModalOpen(true)}
          >
            New Request
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Total Requests</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800">Pending</h3>
            <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Completed</h3>
            <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as RequestStatus)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Requests
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{request.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full
                          ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                          ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                          ${request.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' : ''}
                        `}>
                          {request.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RequestFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewRequest}
      />
      
      <RequestDetailsModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </main>
  )
}
