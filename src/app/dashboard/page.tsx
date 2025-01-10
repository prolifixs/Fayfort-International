'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { toast } from 'react-hot-toast';
import type { Database } from '@/app/components/types/database.types';
import { supabase } from '../components/lib/supabase';
import RequestFormModal, { RequestFormData } from '@/app/components/RequestFormModal';
import { useProducts } from '../hooks/useProducts';

interface Request {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface DashboardStats {
  totalProducts: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  categoryBreakdown: CategoryCount[];
  recentActivity: any[];
}

interface CategoryCount {
  category: string;
  count: number;
}

type Product = Database['public']['Tables']['products']['Row'];

export default function Dashboard() {
  const { products } = useProducts();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    categoryBreakdown: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'requests' }, 
        () => fetchStats()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        { count: productsCount },
        { data: requestsData },
        { data: activityData },
        { data: categoryData }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('requests')
          .select(`
            id,
            status,
            created_at,
            quantity,
            customer_id,
            product:products (
              name,
              description
            ),
            users!customer_id (
              email
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.rpc('get_category_counts')
      ]);

      setStats({
        totalProducts: productsCount || 0,
        totalRequests: requestsData?.length || 0,
        pendingRequests: requestsData?.filter(r => r.status === 'pending').length || 0,
        approvedRequests: requestsData?.filter(r => r.status === 'approved').length || 0,
        categoryBreakdown: categoryData || [],
        recentActivity: activityData || []
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      toast.error('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = (product: Product) => {
    setSelectedProduct(product);
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmit = async (formData: RequestFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert([{
          ...formData,
          customer_id: session.user.id,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (requestError) throw requestError;

      toast.success('Request submitted successfully');
      setIsRequestModalOpen(false);
      fetchStats(); // Refresh dashboard stats
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'supplier']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Request
          </button>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Products
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {stats.totalProducts}
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Requests
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {stats.totalRequests}
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Requests
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {stats.pendingRequests}
                  </dd>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                  {stats.recentActivity.map((activity) => (
                    <li key={activity.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {activity.type}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {activity.user_email}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Add Request button to your products section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products?.map((product) => (
                <div key={product.id} className="border p-4 rounded-lg">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="object-cover w-full h-48 rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <p className="text-sm">Price: {product.price_range}</p>
                  <button
                    onClick={() => handleRequestClick(product)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Request Product
                  </button>
                </div>
              ))}
            </div>

            {/* Add the modal */}
            {selectedProduct && (
              <RequestFormModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSubmit={handleRequestSubmit}
                product={selectedProduct}
              />
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
} 