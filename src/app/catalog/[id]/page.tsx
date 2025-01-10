'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import RequestFormModal from '@/app/components/RequestFormModal';
import type { RequestFormData } from '@/app/components/RequestFormModal';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/app/components/ProtectedRoute';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price_range: string;
  image_url: string;
  availability: boolean;
  specifications?: Record<string, any>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Product not found');

        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, router, supabase]);

  const handleRequestSubmit = async (formData: RequestFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Please login to submit a request');
        router.push('/login');
        return;
      }

      // Create request
      const { error: requestError } = await supabase
        .from('requests')
        .insert([{
          product_id: params.id,
          customer_id: session.user.id,
          quantity: formData.quantity,
          budget: parseFloat(product?.price_range || '0'),
          notes: formData.notes,
          status: 'pending'
        }]);

      if (requestError) throw requestError;

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          type: 'request',
          description: `New request created for ${product?.name}`,
          user_email: session.user.email
        }]);

      toast.success('Request submitted successfully');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error submitting request:', err);
      toast.error('Failed to submit request');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['customer', 'admin', 'supplier']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <LoadingSpinner />
          </div>
        ) : !product ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
            <Link href="/catalog" className="mt-4 text-blue-600 hover:text-blue-500">
              Return to catalog
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
            {/* Image Section */}
            <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
              <img
                src={product.image_url || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-center object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.jpg';
                  console.log('Image failed to load:', product.image_url);
                }}
              />
            </div>

            {/* Product Info */}
            <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                {product.name}
              </h1>
              
              <div className="mt-3">
                <p className="text-3xl text-gray-900">${product.price_range}</p>
              </div>

              <div className="mt-6">
                <h3 className="sr-only">Description</h3>
                <div className="text-base text-gray-700">
                  {product.description}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center">
                  <div className={`rounded-full h-4 w-4 flex items-center justify-center ${
                    product.availability ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${
                      product.availability ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                  </div>
                  <p className="ml-2 text-sm text-gray-500">
                    {product.availability ? 'In stock' : 'Out of stock'}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={!product.availability}
                  className={`w-full bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-blue-500 ${
                    !product.availability ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Request Product
                </button>
              </div>
            </div>
          </div>
        )}

        {product && (
          <RequestFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleRequestSubmit}
            product={product}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}