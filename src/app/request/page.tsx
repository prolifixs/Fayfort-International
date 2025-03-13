'use client'

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import RequestsTable from '@/app/components/admin/RequestsTable';
import { toast } from 'react-hot-toast';
import type { Database } from '@/app/components/types/database.types';
import { RequestStatus, RequestWithRelations, SortField } from '../components/types/request.types';
import RequestFilters from '@/app/components/admin/RequestFilters';
import { RequestGuide } from '@/app/components/dashboard/request/RequestGuide';
import { statusService } from '@/services/statusService';
import RoleBasedNavItem from '@/app/components/common/RoleBasedNavItem';

type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function RequestPage() {
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filteredRequests, setFilteredRequests] = useState<RequestWithRelations[]>([]);

  const itemsPerPage = 10;
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const channel = supabase
      .channel('request_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'requests' }, 
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    // Initialize filteredRequests with all requests
    setFilteredRequests(requests);
  }, [requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          status,
          created_at,
          customer_id,
          product_id,
          quantity,
          budget,
          customer:users!requests_customer_id_fkey (
            id,
            email
          ),
          product:products!requests_product_id_fkey (
            id,
            name
          )
        `)
        .order(sortField, { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setRequests(data?.map(item => ({
        id: item.id,
        status: item.status,
        created_at: item.created_at,
        quantity: item.quantity,
        budget: item.budget,
        product: {
          id: item.product?.[0]?.id || item.product_id,
          name: item.product?.[0]?.name || 'Unknown'
        },
        customer: {
          id: item.customer?.[0]?.id || item.customer_id,
          email: item.customer?.[0]?.email || 'Unknown'
        }
      })) || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: RequestStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: requestData, error: fetchError } = await supabase
        .from('requests')
        .select(`
          id,
          status,
          customer_id,
          product_id,
          quantity,
          budget,
          customer:users!requests_customer_id_fkey (
            id,
            email
          ),
          product:products!requests_product_id_fkey (
            id,
            name
          )
        `)
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!requestData) throw new Error('Request not found');

      // Add logging to debug the structure
      console.log('Request Data:', requestData);

      // Access the email correctly from the array structure
      const customerEmail = requestData.customer?.[0]?.email;
      if (!customerEmail) {
        throw new Error('Customer email not found');
      }

      await statusService.updateStatus(
        requestId,
        newStatus,
        user.id,
        customerEmail,  // Use the extracted email
        newStatus === 'shipped' ? getShippingInfo() : undefined
      );

      toast.success(`Request ${newStatus} successfully`);
      await fetchRequests();
    } catch (err) {
      console.error('Error updating request status:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update request status');
    }
  };

  // Helper function for shipping info
  const getShippingInfo = () => {
    // You can implement this based on your UI needs
    return {
      trackingNumber: '',
      carrier: '',
      shippingDate: new Date().toISOString()
    };
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleFilterChange = (filters: any) => {
    const filtered = requests.filter(request => {
      const matchesSearch = !filters.search || 
        request.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        request.product.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus = filters.status === 'all' || request.status === filters.status;
      const matchesDateRange = (!filters.dateRange.start || new Date(request.created_at) >= filters.dateRange.start) &&
        (!filters.dateRange.end || new Date(request.created_at) <= filters.dateRange.end);
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
    setFilteredRequests(filtered);
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'supplier']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Requests</h1>
          </div>
        </div>

        <RequestFilters onFilterChange={handleFilterChange} />

        {loading ? (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <RequestsTable
            requests={filteredRequests}
            onStatusUpdate={handleStatusChange}
            onSort={handleSort}
            sortField={sortField}
            sortOrder={sortOrder}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
      <RequestGuide />
      <RoleBasedNavItem href="/request" allowedRoles={['admin', 'supplier']}>
        <span>Requests</span>
      </RoleBasedNavItem>
    </ProtectedRoute>
  );
}
