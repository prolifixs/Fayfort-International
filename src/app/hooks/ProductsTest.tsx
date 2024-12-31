'use client';
import { useProducts } from '@/app/hooks/useProducts';
import { useEffect, useState } from 'react';
import { testConnection } from '@/app/components/lib/supabase-test';

export default function ProductsTest() {
  const { products, loading, error } = useProducts();
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'failed'>('testing');

  useEffect(() => {
    async function checkConnection() {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'success' : 'failed');
    }
    checkConnection();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
        <div className="space-y-2">
          <p>Connection Status: 
            <span className={`ml-2 px-2 py-1 rounded ${
              connectionStatus === 'testing' ? 'bg-yellow-100 text-yellow-800' :
              connectionStatus === 'success' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {connectionStatus === 'testing' ? 'Testing...' :
               connectionStatus === 'success' ? 'Connected' :
               'Failed'}
            </span>
          </p>
        </div>
      </div>

      <div className="border p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Products Data Test</h2>
        {loading && <div>Loading products...</div>}
        {error && <div className="text-red-500">Error: {error}</div>}
        {products && (
          <>
            <p className="mb-2">Total Products: {products.length}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border p-4 rounded-lg">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <p className="text-sm">Price: {product.price_range}</p>
                  <p className="text-sm">Category: {product.category}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}