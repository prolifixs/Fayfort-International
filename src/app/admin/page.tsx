'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import StatisticsChart from '../components/admin/charts/StatisticsChart';

interface DashboardStats {
  totalUsers: number;
  activeProducts: number;
  pendingRequests: number;
  totalCategories: number;
  recentRequests: any[]; // We'll type this properly later
}

interface ChartData {
  requestsOverTime: number[];
  userGrowth: number[];
  productDistribution: number[];
  revenueData: number[];
  labels: string[];
  categoryLabels: string[];
  revenueLabels: string[];
}

async function fetchAllRequests() {
  const supabase = createClientComponentClient()
  
  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      product:products!inner (
        id,
        name
      ),
      customer:users!requests_customer_id_fkey (
        id,
        email
      )
    `)
    .order('created_at', { ascending: false })

  console.log('[Admin/Page] Fetch Results:', {
    requestCount: data?.length || 0,
    hasNullCustomers: data?.some(r => !r.customer_id),
    timestamp: new Date().toISOString()
  })

  if (error) throw error
  return data
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
  const [chartData, setChartData] = useState<ChartData>({
    requestsOverTime: [],
    userGrowth: [],
    productDistribution: [],
    revenueData: [],
    labels: [],
    categoryLabels: [],
    revenueLabels: []
  });
  const [filterRange, setFilterRange] = useState<'week' | 'month' | 'year'>('week');
  
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
      console.log('[Dashboard] Starting data fetch...');
      
      const productsQuery = supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('availability', true);
      
      console.log('[Dashboard] Products query:', productsQuery);

      const [
        { count: userCount },
        { count: productCount, error: productError },
        { count: requestCount },
        { data: categories },
        { data: recentRequests, error: requestError }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        productsQuery,
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('categories').select('*', { count: 'exact' }),
        supabase.from('requests')
          .select(`
            id,
            status,
            created_at,
            quantity,
            budget,
            customer:users (
              id,
              email
            ),
            product:products (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false })
      ]);

      console.log('[Dashboard] Query Results:', {
        userCount,
        productCount,
        productError,
        requestCount,
        categoriesCount: categories?.length,
        recentRequestsCount: recentRequests?.length,
        requestError
      });

      setStats({
        totalUsers: userCount || 0,
        activeProducts: productCount || 0,
        pendingRequests: requestCount || 0,
        totalCategories: categories?.length || 0,
        recentRequests: recentRequests || []
      });
    } catch (error) {
      console.error('[Dashboard] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleFilterChange = async (range: string) => {
    setFilterRange(range as 'week' | 'month' | 'year');
    await fetchChartData(range as 'week' | 'month' | 'year');
  };

  const fetchChartData = async (range: 'week' | 'month' | 'year' = 'week') => {
    try {
      const supabase = createClientComponentClient();
      
      // Calculate date range
      const daysToFetch = range === 'week' ? 7 : range === 'month' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToFetch);
      
      // Fetch all required data
      const [requestsData, usersData, productsData, revenueData] = await Promise.all([
        supabase
          .from('requests')
          .select('created_at')
          .gte('created_at', startDate.toISOString()),
        
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', startDate.toISOString()),
        
        supabase
          .from('products')
          .select('category'),
        
        supabase
          .from('requests')
          .select('created_at, budget')
          .gte('created_at', startDate.toISOString())
          .eq('status', 'completed')
      ]);

      // Process data for charts
      const requestsPerDay = Array.from({length: daysToFetch}, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return requestsData.data?.filter(r => r.created_at.startsWith(d.toISOString().split('T')[0])).length || 0;
      });

      const usersPerDay = Array.from({length: daysToFetch}, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return usersData.data?.filter(u => u.created_at.startsWith(d.toISOString().split('T')[0])).length || 0;
      });

      // Process category distribution
      const categories = productsData.data?.reduce((acc: any, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {});

      // Process revenue data
      const revenuePerDay = Array.from({length: daysToFetch}, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return revenueData.data?.filter(r => r.created_at.startsWith(d.toISOString().split('T')[0])).reduce((sum, r) => sum + (r.budget || 0), 0) || 0;
      });

      setChartData({
        requestsOverTime: requestsPerDay,
        userGrowth: usersPerDay,
        productDistribution: Object.values(categories || {}),
        revenueData: revenuePerDay,
        labels: Array.from({length: daysToFetch}, (_, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          return d.toLocaleDateString();
        }),
        categoryLabels: Object.keys(categories || {}),
        revenueLabels: Array.from({length: daysToFetch}, (_, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          return d.toLocaleDateString();
        })
      });

    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  // Calculate summary statistics from dummy data
  const totalUsers = stats.totalUsers;
  const activeProducts = stats.activeProducts;
  const pendingRequests = stats.pendingRequests;
  const totalCategories = stats.totalCategories;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/email-analytics"
            className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            title="Email Analytics"
          >
            <svg 
              className="w-6 h-6 text-gray-600"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
              />
            </svg>
          </Link>
          {isLoading && <LoadingSpinner />}
        </div>
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
            {stats.recentRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="text-sm">
                <p className="text-gray-600">
                  New request for {request.product?.name || 'Unknown Product'}
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <StatisticsChart
            type="line"
            title="Requests Over Time"
            data={chartData.requestsOverTime}
            labels={chartData.labels}
            colorScheme="ocean"
            filterRange={filterRange}
            onFilterChange={handleFilterChange}
          />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <StatisticsChart
            type="line"
            title="User Growth"
            data={chartData.userGrowth}
            labels={chartData.labels}
            colorScheme="forest"
            filterRange={filterRange}
            onFilterChange={handleFilterChange}
          />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <StatisticsChart
            type="pie"
            title="Product Distribution by Category"
            data={chartData.productDistribution}
            labels={chartData.categoryLabels}
            colorScheme="sunset"
          />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <StatisticsChart
            type="bar"
            title="Revenue Analytics"
            data={chartData.revenueData}
            labels={chartData.revenueLabels}
            colorScheme="default"
            filterRange={filterRange}
            onFilterChange={handleFilterChange}
          />
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
              {stats.recentRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.customer?.email || 'Unknown User'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.product?.name}</div>
                    <div className="text-sm text-gray-500">Qty: {request.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      request.status === 'approved' ? 'bg-green-100 text-green-800' : 
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