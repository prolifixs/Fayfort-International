'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import Pagination from '@/app/components/admin/Pagination';
import type { Database } from '@/app/components/types/database.types';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { supabaseAdmin } from '@/app/components/lib/supabase'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'

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
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const itemsPerPage = 10;
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const channel = supabaseAdmin
      .channel('admin_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, 
        () => fetchUsers())
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortField, sortOrder, roleFilter, statusFilter, searchQuery]);

  const fetchUsers = async () => {
    try {
      console.log('🔍 Starting fetchUsers');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📌 Session:', session);
      
      if (!session?.user) {
        console.error('❌ No session found');
        throw new Error('Not authenticated');
      }

      // Use supabaseAdmin for role check
      const { data: adminCheck, error: roleError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      console.log('👤 Admin Check:', { adminCheck, roleError });

      if (adminCheck?.role !== 'admin') {
        console.error('❌ User is not admin:', adminCheck?.role);
        throw new Error('Unauthorized access');
      }

      console.log('✅ Admin access confirmed');
      
      // Continue with supabaseAdmin for fetching users
      let query = supabaseAdmin
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
      const { error } = await supabaseAdmin
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

  const handleDeleteUser = async (userId: string) => {
    try {
      // 1. Delete all related records first
      const { error: relatedDataError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (relatedDataError) throw relatedDataError;

      // 2. Delete the auth user
      const { error: authError } = await supabaseAdmin.auth.admin
        .deleteUser(userId);

      if (authError) throw authError;

      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleBulkAction = async (action: 'suspend' | 'activate' | 'delete') => {
    if (!selectedUsers.length) return;

    try {
      switch (action) {
        case 'suspend':
        case 'activate':
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ 
              status: action === 'suspend' ? 'suspended' : 'active',
              updated_at: new Date().toISOString()
            })
            .in('id', selectedUsers);

          if (updateError) throw updateError;
          break;

        case 'delete':
          const { error: deleteError } = await supabaseAdmin
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

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const renderUserActions = (user: User) => {
    const isCurrentUser = user.id === currentUserId;
    
    return (
      <>
        <select 
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value)}
          disabled={isCurrentUser}
          className={isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
        </select>
        
        <select
          value={user.status}
          onChange={(e) => handleStatusChange(user.id, e.target.value as 'active' | 'suspended')}
          disabled={isCurrentUser}
          className={isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
        
        <button
          onClick={() => !isCurrentUser && openDeleteDialog(user)}
          disabled={isCurrentUser}
          className={`text-red-500 hover:text-red-700 ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Delete
        </button>
      </>
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
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
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
                          Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Role
                        </th>
                        <th 
                          scope="col" 
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                          onClick={() => handleSort('status')}
                        >
                          Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          scope="col" 
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                          onClick={() => handleSort('created_at')}
                        >
                          Created At {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
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
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {renderUserActions(user)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' :
                              user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.status}
                            </span>
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

        {/* Delete Confirmation Dialog */}
        <Transition.Root show={isDeleteDialogOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={setIsDeleteDialogOpen}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                          Delete User
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete the user{' '}
                            <span className="font-medium text-gray-900">{userToDelete?.email}</span>?
                            This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                        onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={() => {
                          setIsDeleteDialogOpen(false);
                          setUserToDelete(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </div>
    </ProtectedRoute>
  );
} 