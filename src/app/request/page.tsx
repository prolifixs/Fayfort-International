'use client'

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import RequestsTable from '@/app/components/RequestsTable';
import { toast } from 'react-hot-toast';
import type { Database } from '@/app/components/types/database.types';
import { RequestStatus, RequestWithRelations, SortField } from '../components/types/request.types';
import RequestFilters from '@/app/components/RequestFilters';
import { RequestGuide } from '@/app/components/request/RequestGuide';

type Request = RequestWithRelations;

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
          quantity,
          budget,
          customer_id,
          product_id,
          customer:users!left (
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
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for status change
      await supabase
        .from('notifications')
        .insert({
          type: 'status_change',
          content: `Request ${requestId} has been ${newStatus}`,
          reference_id: requestId,
          read_status: false,
          created_at: new Date().toISOString()
        });

      // Add to activity log
      await supabase
        .from('activity_log')
        .insert({
          type: 'status_change',
          description: `Request ${requestId} ${newStatus}`,
          created_at: new Date().toISOString()
        });

      toast.success(`Request ${newStatus} successfully`);
      await fetchRequests();
    } catch (err) {
      console.error('Error updating request status:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update request status');
    }
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
    </ProtectedRoute>
  );
}
