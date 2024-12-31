'use client';
import { useProducts } from '@/app/hooks/useProducts';
import { useEffect, useState, useCallback } from 'react';
import { testConnection } from '@/app/components/lib/supabase-test';
import { supabase } from '@/app/components/lib/supabase';
import debounce from 'lodash/debounce';

interface DebugInfo {
  supabaseUrl: string;
  supabaseKey: string;
  versionData: unknown;
  versionError?: string;
}

export default function ProductsTest() {
  const { products, loading, error } = useProducts({
    limit: 5,
    disableRealtime: true
  });
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'failed'>('testing');
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    supabaseUrl: '',
    supabaseKey: '',
    versionData: null,
    versionError: undefined
  });

  const logDebounced = useCallback(
    debounce((data) => {
      console.log('Render state:', data);
    }, 1000),
    []
  );

  useEffect(() => {
    async function checkConnection() {
      try {
        console.log('Starting connection test...');
        
        // Test basic connection
        const { data: versionData, error: versionError } = await supabase.from('products').select('count');
        
        setDebugInfo({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
          versionData,
          versionError: versionError?.message,
        });

        const isConnected = await testConnection();
        setConnectionStatus(isConnected ? 'success' : 'failed');
      } catch (err) {
        console.error('Connection test error:', err);
        setConnectionStatus('failed');
      }
    }
    checkConnection();
  }, []);

  logDebounced({ loading, error, productsCount: products?.length });

  return (
    <div className="space-y-6">
      <div className="border p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
        <pre className="bg-gray-100 p-4 rounded mb-4">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
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