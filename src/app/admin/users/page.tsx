'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Pagination from '@/app/components/Pagination';
import type { Database } from '@/app/components/types/database.types';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { supabaseAdmin } from '@/app/components/lib/supabase'

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in: string;
  status: 'active' | 'suspended' | 'pending';
}

type SortField = 'email' | 'role' | 'created_at' | 'last_sign_in' | 'status';
type SortOrder = 'asc' | 'desc';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const itemsPerPage = 10;
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const channel = supabase
      .channel('admin_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, 
        () => fetchUsers())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortField, sortOrder, roleFilter, statusFilter, searchQuery]);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      // Verify admin role
      const { data: adminCheck } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (adminCheck?.role !== 'admin') {
        throw new Error('Unauthorized access');
      }

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Apply filters
      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%`);
      }
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) throw error;

      setUsers(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User status updated to ${newStatus}`);
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Update in public.users
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (dbError) throw dbError

      // Update in auth.users metadata
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { user_metadata: { role: newRole } }
      )

      if (authError) throw authError

      toast.success('User role updated successfully')
    } catch (error) {
      console.error('Role update failed:', error)
      toast.error('Failed to update user role')
    }
  }

  const handleBulkAction = async (action: 'suspend' | 'activate' | 'delete') => {
    if (!selectedUsers.length) return;

    try {
      switch (action) {
        case 'suspend':
        case 'activate':
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              status: action === 'suspend' ? 'suspended' : 'active',
              updated_at: new Date().toISOString()
            })
            .in('id', selectedUsers);

          if (updateError) throw updateError;
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .in('id', selectedUsers);

          if (deleteError) throw deleteError;
          break;
      }

      toast.success(`Bulk action "${action}" completed successfully`);
      setSelectedUsers([]);
      await fetchUsers();
    } catch (err) {
      console.error('Error performing bulk action:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to perform bulk action');
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    setSelectedUsers(prev => 
      prev.length === users.length ? [] : users.map(user => user.id)
    );
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkAction('suspend')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
            >
              Suspend Selected
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="px-3 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length}
                          onChange={toggleAllUsers}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => handleSort('email')}
                      >
                        Email
                        {sortField === 'email' && (
                          <span className="ml-2">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => handleSort('role')}
                      >
                        Role
                        {sortField === 'role' && (
                          <span className="ml-2">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        {sortField === 'status' && (
                          <span className="ml-2">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => handleSort('created_at')}
                      >
                        Created At
                        {sortField === 'created_at' && (
                          <span className="ml-2">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th scope="col" className="px-3 py-3.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="whitespace-nowrap px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="customer">Customer</option>
                            <option value="supplier">Supplier</option>
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <select
                            value={user.status}
                            onChange={(e) => handleStatusChange(user.id, e.target.value as 'active' | 'suspended')}
                            className={`rounded-md shadow-sm focus:ring-blue-500 ${
                              user.status === 'active'
                                ? 'text-green-800 bg-green-100 border-green-200'
                                : user.status === 'suspended'
                                ? 'text-red-800 bg-red-100 border-red-200'
                                : 'text-yellow-800 bg-yellow-100 border-yellow-200'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="pending">Pending</option>
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 