'use client';

import { useState, useEffect } from 'react';
import { RequestStatus, RequestWithRelations, SortField } from '@/app/components/types/request.types';
import { StatusUpdateDropdown } from './StatusUpdateDropdown';
import StatusHistoryModal from './StatusHistoryModal';
import { websocketService } from '@/services/websocketService';
import type { ConnectionStatus } from '@/services/websocketService';
import { NotificationService } from '@/services/notificationService';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useStatusSync } from '@/app/hooks/useStatusSync';
import { StatusService } from '@/services/statusService';
import { StatusBadge } from '../ui/status/StatusBadge';
import { RequestStatus as ConsolidatedRequestStatus } from '@/app/components/types/invoice';

interface RequestsTableProps {
  requests: RequestWithRelations[];
  onStatusUpdate?: (requestId: string, newStatus: RequestStatus) => Promise<void>;
  onSort: (field: SortField) => void;
  sortField: SortField;
  sortOrder: 'asc' | 'desc';
  itemsPerPage?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const DEBUG = true;
const debugLog = (group: string, data: any) => {
  if (DEBUG) {
    console.group(`🔍 ${group}`);
    console.log(data);
    console.groupEnd();
  }
};

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
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isUpdating, setIsUpdating] = useState(false);
  const statusService = new StatusService();

  useEffect(() => {
    console.group('🔄 RequestsTable - Data Flow');
    console.log('1. Initial Requests:', initialRequests);
    
    const transformedRequests = initialRequests.map(request => {
      console.log('2. Processing Request:', {
        id: request.id,
        hasCustomer: Boolean(request.customer),
        hasProduct: Boolean(request.product)
      });
      
      return request;
    });
    
    setRequests(transformedRequests);
    console.groupEnd();
  }, [initialRequests]);

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

  const handleStatusUpdateRequest = async (requestId: string, newStatus: RequestStatus) => {
    debugLog('Status Update Started', {
      requestId,
      newStatus,
      isAdminTriggered: true, // This is from dropdown
      timestamp: new Date().toISOString()
    });

    try {
      setIsUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the current request with ALL related data
      const { data: currentRequest } = await supabase
        .from('requests')
        .select(`
          id,
          status,
          product:products!inner(name),
          customer_id,
          customer:users!inner(id, email, name),
          invoice:invoices(*)
        `)
        .eq('id', requestId)
        .single();

      debugLog('Full Request Context', {
        currentStatus: currentRequest?.status,
        newStatus,
        hasInvoice: Boolean(currentRequest?.invoice?.[0]),
        invoiceStatus: currentRequest?.invoice?.[0]?.status,
        productName: currentRequest?.product[0]?.name,
        hasCustomerEmail: Boolean(currentRequest?.customer?.[0]?.email)
      });

      // Update status
      const { error: updateError } = await supabase
        .from('requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (!updateError) {
        // Status-specific logic
        debugLog('Status-Specific Flow', {
          status: newStatus,
          previousStatus: currentRequest?.status,
          requiresInvoice: ['approved', 'fulfilled'].includes(newStatus),
          hasExistingInvoice: Boolean(currentRequest?.invoice?.[0]),
          invoiceStatus: currentRequest?.invoice?.[0]?.status,
          isStatusChange: currentRequest?.status !== newStatus
        });

        const notificationService = new NotificationService();
        
        // Send both notification and email for all status changes
        await Promise.all([
          // Always send status notification
          notificationService.createNotification({
            type: 'status_change',
            content: `Request status updated to ${newStatus}`,
            reference_id: requestId,
            reference_type: 'request',
            metadata: {
              previousStatus: currentRequest?.status,
              newStatus,
              productName: currentRequest?.product[0]?.name,
              isAdminTriggered: true
            }
          }).catch(error => {
            debugLog('Notification Creation Failed', { error });
          }),

          // Always try to send email
          notificationService.sendStatusUpdateNotification(
            requestId,
            newStatus,
            {
              previousStatus: currentRequest?.status,
              productName: currentRequest?.product[0]?.name
            }
          ).catch(error => {
            debugLog('Email Sending Failed', { error });
          })
        ]);

        debugLog('Notifications Attempted', {
          status: newStatus,
          notificationSent: true,
          emailSent: true
        });
      }

      await onStatusUpdate?.(requestId, newStatus);
      toast.success('Status updated successfully');
    } catch (error) {
      debugLog('Status Update Failed', {
        error,
        requestId,
        newStatus
      });
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, startIndex + itemsPerPage);

  const statusFilters: RequestStatus[] = ['pending', 'approved', 'rejected', 'fulfilled', 'shipped'];

  console.log('3. Current Requests State:', {
    total: requests.length,
    firstItem: requests[0],
    paginationRange: `${startIndex + 1} to ${startIndex + itemsPerPage}`
  });

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
                  <div className="flex items-center space-x-2">
                    <StatusBadge 
                      status={request.status} 
                      type="request" 
                    />
                    {request.invoice?.status && (
                      <StatusBadge 
                        status={request.invoice.status} 
                        type="invoice" 
                      />
                    )}
                    <StatusUpdateDropdown
                      request={request}
                      onStatusChange={(newStatus) => handleStatusUpdateRequest(request.id, newStatus)}
                      disabled={isUpdating}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
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
  );
}