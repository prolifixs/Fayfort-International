'use client';
import { useState, useMemo, useEffect } from 'react';
import { RequestStatus } from '@/services/statusService';
import StatusUpdateDropdown from './StatusUpdateDropdown';
import StatusHistoryModal from './StatusHistoryModal';
import RequestFilters from './RequestFilters';
import Pagination from './Pagination';
import { websocketService } from '@/services/websocketService';
import type { ConnectionStatus as ConnectionStatusType } from '@/services/websocketService';
import { toast } from 'react-hot-toast';
import ConnectionStatusIndicator from '@/app/components/ConnectionStatus';

// Define base Request interface
interface Request {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: string;
}

// Define props interface
interface RequestsTableProps {
  requests: Request[];
  onStatusUpdate: (requestId: string, newStatus: RequestStatus) => void;
}

// Define Filters interface
interface Filters {
  search?: string;
  status?: RequestStatus | 'all';
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

// Define sort configuration
interface SortConfig {
  key: keyof Request;
  direction: 'asc' | 'desc';
  priority: number;  // Lower number = higher priority
}

// Define constants
const ITEMS_PER_PAGE = 10;

// Add these utility functions at the top of the file
const SORT_PREFERENCES_KEY = 'table-sort-preferences';

function getSavedSortPreferences(): SortConfig[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(SORT_PREFERENCES_KEY);
  try {
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveSortPreferences(configs: SortConfig[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SORT_PREFERENCES_KEY, JSON.stringify(configs));
}

// Add this helper component for sort indicators
function SortIndicator({ configs, columnKey }: { 
  configs: SortConfig[]; 
  columnKey: keyof Request;
}) {
  const config = configs.find(c => c.key === columnKey);
  if (!config) return <span className="ml-2 text-gray-400">↕</span>;
  
  return (
    <span className="ml-2">
      {config.direction === 'asc' ? '↑' : '↓'}
      {configs.length > 1 && (
        <sup className="ml-0.5 text-xs">{config.priority + 1}</sup>
      )}
    </span>
  );
}

// Add keyboard event handler types
interface SortableColumnProps {
  label: string;
  sortKey: keyof Request;
  sortConfigs: SortConfig[];
  onSort: (key: keyof Request, event: React.MouseEvent | React.KeyboardEvent) => void;
}

// Create a SortableColumn component for better organization
function SortableColumn({ label, sortKey, sortConfigs, onSort }: SortableColumnProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSort(sortKey, event);
    }
  };

  return (
    <th 
      onClick={(e) => onSort(sortKey, e)}
      onKeyDown={handleKeyDown}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      tabIndex={0}
      role="columnheader"
      aria-sort={
        sortConfigs.find(config => config.key === sortKey)?.direction === 'asc'
          ? 'ascending'
          : sortConfigs.find(config => config.key === sortKey)?.direction === 'desc'
          ? 'descending'
          : 'none'
      }
    >
      {label}
      <SortIndicator configs={sortConfigs} columnKey={sortKey} />
    </th>
  );
}

export default function RequestsTable({ requests: initialRequests, onStatusUpdate }: RequestsTableProps) {
  // Add state for real-time requests
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('connecting');

  // Subscribe to WebSocket updates
  useEffect(() => {
    const unsubscribeStatus = websocketService.subscribeToStatus(setConnectionStatus);
    
    const unsubscribeUpdates = websocketService.subscribe('REQUEST_UPDATE', (updatedRequest: Request) => {
      setRequests(current => 
        current.map(request => {
          if (request.id === updatedRequest.id) {
            toast.success(`Request ${request.id} has been updated`);
            return { ...request, ...updatedRequest };
          }
          return request;
        })
      );
    });

    return () => {
      unsubscribeStatus();
      unsubscribeUpdates();
    };
  }, []);

  // State
  const [filters, setFilters] = useState<Filters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>(() => {
    const saved = getSavedSortPreferences();
    return saved.length > 0 ? saved : [{ key: 'createdAt', direction: 'desc', priority: 0 }];
  });

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Search filter
      if (filters.search && !request.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      // Status filter
      if (filters.status && filters.status !== 'all' && request.status !== filters.status) {
        return false;
      }
      // Date range filter
      if (filters.dateRange?.start && new Date(request.createdAt) < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange?.end && new Date(request.createdAt) > filters.dateRange.end) {
        return false;
      }
      return true;
    });
  }, [requests, filters]);

  // Sort filtered requests
  const sortedAndFilteredRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      // Sort by each config in priority order
      for (const config of sortConfigs) {
        if (a[config.key] < b[config.key]) {
          return config.direction === 'asc' ? -1 : 1;
        }
        if (a[config.key] > b[config.key]) {
          return config.direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }, [filteredRequests, sortConfigs]);

  // Paginate sorted requests
  const paginatedRequests = useMemo(() => {
    return sortedAndFilteredRequests.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [sortedAndFilteredRequests, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedAndFilteredRequests.length / ITEMS_PER_PAGE);

  // Event handlers
  const handleSort = (key: keyof Request, event: React.MouseEvent | React.KeyboardEvent) => {
    setSortConfigs(current => {
      const existingIndex = current.findIndex(config => config.key === key);
      const newConfigs = [...current];

      if (existingIndex !== -1) {
        if (newConfigs[existingIndex].direction === 'asc') {
          newConfigs[existingIndex].direction = 'desc';
        } else {
          newConfigs.splice(existingIndex, 1);
        }
      } else {
        const newConfig: SortConfig = {
          key,
          direction: 'asc',
          priority: event instanceof MouseEvent && event.shiftKey ? current.length : 0
        };
        
        if (!(event instanceof MouseEvent && event.shiftKey)) {
          newConfigs.length = 0;
        }
        newConfigs.push(newConfig);
      }

      const updatedConfigs = newConfigs.map((config, index) => ({
        ...config,
        priority: index
      }));

      saveSortPreferences(updatedConfigs);
      return updatedConfigs;
    });
  };

  const handleResetSort = () => {
    const defaultSort = [{ key: 'createdAt' as keyof Request, direction: 'desc' as const, priority: 0 }];
    setSortConfigs(defaultSort);
    saveSortPreferences(defaultSort);
  };

  const handleStatusUpdate = (requestId: string, newStatus: RequestStatus) => {
    onStatusUpdate(requestId, newStatus);
    if (selectedRequestId === requestId) {
      setSelectedRequestId(null);
    }
  };

  // Add keyboard navigation for the reset button
  const handleResetKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleResetSort();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <RequestFilters onFilterChange={setFilters} />
        <div className="flex items-center space-x-4">
          <ConnectionStatusIndicator status={connectionStatus} />
          <button
            onClick={handleResetSort}
            onKeyDown={handleResetKeyDown}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            tabIndex={0}
            aria-label="Reset sort order"
          >
            Reset Sort
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200" role="grid">
          <thead className="bg-gray-50">
            <tr>
              <SortableColumn
                label="Request ID"
                sortKey="id"
                sortConfigs={sortConfigs}
                onSort={handleSort}
              />
              <SortableColumn
                label="Title"
                sortKey="title"
                sortConfigs={sortConfigs}
                onSort={handleSort}
              />
              <SortableColumn
                label="Status"
                sortKey="status"
                sortConfigs={sortConfigs}
                onSort={handleSort}
              />
              <SortableColumn
                label="Created At"
                sortKey="createdAt"
                sortConfigs={sortConfigs}
                onSort={handleSort}
              />
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
                  {request.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusUpdateDropdown
                    requestId={request.id}
                    currentStatus={request.status}
                    onStatusUpdate={(newStatus) => handleStatusUpdate(request.id, newStatus)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.createdAt).toLocaleString()}
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