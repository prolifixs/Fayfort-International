'use client'

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import RequestsTable from '@/app/components/RequestsTable';
import { toast } from 'react-hot-toast';
import type { Database } from '@/app/components/types/database.types';

interface Request {
  id: string;
  product_id: string;
  user_id: string;
  customer_id: string;
  quantity: number;
  budget: number;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  product: {
    name: string;
    category: string;
    image_url: string | null;
  };
  user: {
    email: string;
  };
}

type SortField = 'created_at' | 'status' | 'product.name' | 'user.email';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function RequestPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

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
  }, [currentPage, sortField, sortOrder, statusFilter, searchQuery]);

  const fetchRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      let query = supabase
        .from('requests')
        .select(`
          *,
          product:products (
            name,
            category
          ),
          user:users (
            email
          )
        `, { count: 'exact' });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery) {
        query = query.or(`
          product.name.ilike.%${searchQuery}%,
          user.email.ilike.%${searchQuery}%
        `);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Apply sorting
      const { data, error, count } = await query
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) throw error;

      setRequests(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (err) {
      console.error('Error fetching requests:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

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

  return (
    <ProtectedRoute allowedRoles={['admin', 'supplier']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Requests</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <RequestsTable
            requests={requests}
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
    </ProtectedRoute>
  );
}
