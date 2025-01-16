'use client';

import { useState, useEffect } from 'react';
import { RequestWithRelations, SortField } from '@/app/components/types/request.types';
import StatusUpdateDropdown from './StatusUpdateDropdown';
import StatusHistoryModal from './StatusHistoryModal';
import { websocketService } from '@/services/websocketService';
import type { ConnectionStatus } from '@/services/websocketService';

interface RequestsTableProps {
  requests: RequestWithRelations[];
  onStatusUpdate?: (requestId: string, newStatus: 'approved' | 'rejected') => Promise<void>;
  onSort: (field: SortField) => void;
  sortField: SortField;
  sortOrder: 'asc' | 'desc';
  itemsPerPage?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function RequestsTable({ 
  requests: initialRequests, 
  onStatusUpdate,
  onSort,
  sortField,
  sortOrder,
  itemsPerPage = 10,
  currentPage,
  totalPages,
  onPageChange
}: RequestsTableProps) {
  const [requests, setRequests] = useState<RequestWithRelations[]>(initialRequests);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    setRequests(initialRequests)
  }, [initialRequests])

  useEffect(() => {
    const unsubscribeStatus = websocketService.subscribeToStatus(setConnectionStatus);
    
    const unsubscribeUpdates = websocketService.subscribe('REQUEST_UPDATE', (data) => {
      const updatedRequest = data as unknown as RequestWithRelations;
      setRequests(current => 
        current.map(request => 
          request.id === updatedRequest.id ? { ...request, ...updatedRequest } : request
        )
      );
    });

    return () => {
      unsubscribeStatus();
      unsubscribeUpdates();
    }
  }, []);

  const handleStatusUpdate = (requestId: string, newStatus: 'approved' | 'rejected') => {
    onStatusUpdate?.(requestId, newStatus);
    if (selectedRequestId === requestId) {
      setSelectedRequestId(null);
    }
  };

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRequests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {request.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${request.budget}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusUpdateDropdown
                    requestId={request.id}
                    currentStatus={request.status}
                    onStatusUpdate={(newStatus) => handleStatusUpdate(request.id, newStatus)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => setSelectedRequestId(request.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, requests.length)}
              </span>{' '}
              of <span className="font-medium">{requests.length}</span> results
            </p>
          </div>
          <div>
            <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                    currentPage === page
                      ? 'z-10 bg-blue-600 text-white'
                      : 'text-gray-500 bg-white hover:bg-gray-50'
                  } border border-gray-300`}
                >
                  {page}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {selectedRequestId && (
        <StatusHistoryModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
        />
      )}
    </div>
  );
}