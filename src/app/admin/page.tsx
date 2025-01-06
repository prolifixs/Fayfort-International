'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalUsers: number;
  activeProducts: number;
  pendingRequests: number;
  totalCategories: number;
  recentRequests: any[]; // We'll type this properly later
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeProducts: 0,
    pendingRequests: 0,
    totalCategories: 0,
    recentRequests: []
  });
  
  const supabase = createClientComponentClient();

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const requestsSubscription = supabase
      .channel('requests-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'requests' },
        () => fetchDashboardData()
      )
      .subscribe();

    const productsSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchDashboardData()
      )
      .subscribe();

    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      requestsSubscription.unsubscribe();
      productsSubscription.unsubscribe();
      usersSubscription.unsubscribe();
    };
  }, [supabase]);

  async function fetchDashboardData() {
    try {
      const [
        { data: users },
        { data: products },
        { data: requests },
        { data: recentRequests }
      ] = await Promise.all([
        supabase.from('users').select('count'),
        supabase.from('products').select('count').eq('availability', true),
        supabase.from('requests').select('count').eq('status', 'pending'),
        supabase.from('requests')
          .select(`
            id,
            status,
            created_at,
            customer_id,
            product_details:products (*)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      setStats({
        totalUsers: users?.[0]?.count || 0,
        activeProducts: products?.[0]?.count || 0,
        pendingRequests: requests?.[0]?.count || 0,
        totalCategories: 0,
        recentRequests: recentRequests || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate summary statistics from dummy data
  const totalUsers = stats.totalUsers;
  const activeProducts = stats.activeProducts;
  const pendingRequests = stats.pendingRequests;
  const totalCategories = stats.totalCategories;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {isLoading && <LoadingSpinner />}
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/users">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">User Management</h2>
            <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
            <div className="mt-4 text-blue-600">Access →</div>
          </div>
        </Link>

        <Link href="/admin/catalog">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Catalog Management</h2>
            <p className="text-gray-600">Manage products, categories, and availability</p>
            <div className="mt-4 text-blue-600">Access →</div>
          </div>
        </Link>

        {/* Recent Activity Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
          <div className="space-y-3">
            {stats.recentRequests.slice(0, 3).map(request => (
              <div key={request.id} className="text-sm">
                <p className="text-gray-600">
                  New request for {request.product_details.name}
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {request.status}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Total Users</h3>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Active Products</h3>
          <p className="text-2xl font-bold">{activeProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Pending Requests</h3>
          <p className="text-2xl font-bold">{pendingRequests}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">Total Categories</h3>
          <p className="text-2xl font-bold">{totalCategories}</p>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentRequests.slice(0, 5).map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Customer #{request.customer_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.product_details.name}</div>
                    <div className="text-sm text-gray-500">Qty: {request.product_details.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      request.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 