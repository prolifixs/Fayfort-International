'use client';

import { useState, useMemo, useEffect } from 'react';
import { RequestWithRelations, RequestStatus } from '@/app/components/types/request.types';
import StatusUpdateDropdown from './StatusUpdateDropdown';
import StatusHistoryModal from './StatusHistoryModal';
import RequestFilters from './RequestFilters';
import Pagination from './Pagination';
import { websocketService } from '@/services/websocketService';
import type { ConnectionStatus } from '@/services/websocketService';
import { toast } from 'react-hot-toast';
import ConnectionStatusIndicator from '@/app/components/ConnectionStatus';

type SortField = 'created_at' | 'status' | 'product.name' | 'user.email';

interface RequestsTableProps {
  requests: RequestWithRelations[];
  onStatusUpdate?: (requestId: string, newStatus: 'approved' | 'rejected') => Promise<void>;
  onSort: (field: SortField) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface Filters {
  search?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'all';
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

const ITEMS_PER_PAGE = 10;

export default function RequestsTable({ 
  requests: initialRequests, 
  onStatusUpdate 
}: RequestsTableProps) {
  const [requests, setRequests] = useState<RequestWithRelations[]>(initialRequests);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [filters, setFilters] = useState<Filters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

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
    };
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      if (filters.status && filters.status !== 'all' && request.status !== filters.status) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          request.id.toLowerCase().includes(searchLower) ||
          request.product.name.toLowerCase().includes(searchLower) ||
          request.status.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [requests, filters]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusUpdate = (requestId: string, newStatus: 'approved' | 'rejected') => {
    onStatusUpdate?.(requestId, newStatus);
    if (selectedRequestId === requestId) {
      setSelectedRequestId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <RequestFilters 
          onFilterChange={(newFilters) => setFilters(newFilters as Filters)} 
        />
        <ConnectionStatusIndicator status={connectionStatus} />
      </div>

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
                  {request.id}
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
                  {new Date(request.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => setSelectedRequestId(request.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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