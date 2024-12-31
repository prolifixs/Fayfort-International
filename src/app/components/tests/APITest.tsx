'use client';
import { useState, useEffect } from 'react';
import { useProducts } from '@/app/hooks/useProducts';
import { useRequests } from '@/app/hooks/useRequests';
import { useUsers } from '@/app/hooks/useUsers';
import { useCategories } from '@/app/hooks/useCategories';
import { toast } from 'react-hot-toast';
import { supabase } from '@/app/components/lib/supabase';

interface TestSectionProps {
  title: string;
  children: React.ReactNode;
}

function TestSection({ title, children }: TestSectionProps) {
  return (
    <div className="border p-4 rounded-lg mb-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function APITest() {
  const [testProduct] = useState({
    name: 'Test Product',
    description: 'Test Description',
    category: 'electronics',
    price_range: '$100-$200',
    availability: true
  });

  const [requestData, setRequestData] = useState({
    product_id: '',
    quantity: 1,
    budget: 100,
    status: 'pending' as const
  });

  // Hooks with options
  const { products, loading: productsLoading, error: productsError, refresh: refreshProducts } = useProducts({
    limit: 5,
    disableRealtime: true
  });
  
  const { requests, loading: requestsLoading, error: requestsError, refresh: refreshRequests } = useRequests({
    limit: 5,
    disableRealtime: true
  });
  
  const { users, loading: usersLoading, error: usersError } = useUsers({
    limit: 5,
    disableRealtime: true
  });
  
  const { categories } = useCategories({
    disableRealtime: true
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('APITest component unmounting...');
    };
  }, []);

  const handleProductSelect = (productId: string) => {
    setRequestData(prev => ({
      ...prev,
      product_id: productId
    }));
  };

  const handleQuantityChange = (quantity: number) => {
    if (quantity < 1) return;
    setRequestData(prev => ({
      ...prev,
      quantity: quantity
    }));
  };

  const testCreateProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([testProduct])
        .select();

      if (error) throw error;
      console.log('Created product:', data);
      
      toast.success('Product created successfully!');
      await refreshProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    }
  };

  const testCreateRequest = async () => {
    if (!products?.length || !users?.length) {
      toast.error('No products or users available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('requests')
        .insert([{
          ...requestData,
          product_id: products[0].id,
          customer_id: users[0]?.id
        }])
        .select();

      if (error) throw error;
      console.log('Created request:', data);
      
      toast.success('Request created successfully!');
      await refreshRequests();
      
      setRequestData({
        product_id: '',
        quantity: 1,
        budget: 100,
        status: 'pending' as const
      });
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create request');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">API Testing Dashboard</h1>

      <TestSection title="Products API">
        <div className="space-y-4">
          <button 
            onClick={testCreateProduct}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            disabled={productsLoading}
          >
            {productsLoading ? 'Creating...' : 'Test Create Product'}
          </button>
          {productsLoading && <div className="text-blue-500">Loading products...</div>}
          {productsError && <div className="text-red-500">Error: {productsError}</div>}
          <div>Total Products: {products?.length || 0}</div>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(products?.[0], null, 2)}
          </pre>
        </div>
      </TestSection>

      <TestSection title="Requests API">
        <div className="space-y-4">
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium">Quantity:</label>
              <input
                type="number"
                value={requestData.quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                className="border rounded px-2 py-1"
                min="1"
              />
            </div>
            {products?.length > 0 && (
              <div>
                <label className="block text-sm font-medium">Select Product:</label>
                <select
                  value={requestData.product_id}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button 
            onClick={testCreateRequest}
            disabled={requestsLoading || !products?.length || !users?.length}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
          >
            {requestsLoading ? 'Creating...' : 'Test Create Request'}
          </button>
          {requestsLoading && <div className="text-blue-500">Loading requests...</div>}
          {requestsError && <div className="text-red-500">Error: {requestsError}</div>}
          <div>Total Requests: {requests?.length || 0}</div>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(requests?.[0], null, 2)}
          </pre>
        </div>
      </TestSection>

      <TestSection title="Users API">
        <div className="space-y-4">
          {usersLoading && <div className="text-blue-500">Loading users...</div>}
          {usersError && <div className="text-red-500">Error: {usersError}</div>}
          <div>Total Users: {users?.length || 0}</div>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(users?.[0], null, 2)}
          </pre>
        </div>
      </TestSection>

      <TestSection title="Categories API">
        <div className="space-y-4">
          <div>Total Categories: {categories?.length || 0}</div>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(categories?.[0], null, 2)}
          </pre>
        </div>
      </TestSection>
    </div>
  );
}