'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import RequestFormModal from '@/app/components/dashboard/RequestFormModal';
import { MediaGallery } from '@/app/components/common/MediaGallery/MediaGallery';
import type { RequestFormData } from '@/app/components/dashboard/RequestFormModal';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import type { TableRow } from '@/app/components/types/database.types';
import { ChevronLeft } from 'lucide-react';


type Product = TableRow<'products'> & {
  media?: ProductMedia[]
}
type ProductMedia = TableRow<'product_media'>

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
          .select(`
            *,
            media:product_media(*)
          `)
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

  const handleRequestSubmit = async (formData: RequestFormData): Promise<{ id: string }> => {
    try {
      console.log('Starting request submission...', formData);
      
      // 1. Validate session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No user session found');
        toast.error('Please login to submit a request');
        router.push('/login');
        return { id: '' };
      }

      // 2. Validate product
      if (!product?.price_range) {
        toast.error('Product price is not available');
        return { id: '' };
      }

      // 3. Create request
      const unitPrice = parseFloat(product.price_range);
      const totalBudget = unitPrice * formData.quantity;
      
      const { data, error: requestError } = await supabase
        .from('requests')
        .insert([{
          product_id: params.id,
          customer_id: session.user.id,
          user_id: session.user.id,
          quantity: formData.quantity,
          budget: totalBudget,
          notes: formData.notes,
          status: 'pending'
        }])
        .select()
        .single();

      if (requestError || !data) {
        throw new Error('Failed to create request');
      }

      console.log('Request created successfully:', data.id);
      return { id: data.id };
    } catch (err) {
      console.error('Error submitting request:', err);
      toast.error('Failed to submit request');
      throw err;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['customer', 'admin', 'supplier']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Catalog</span>
          </button>
        </div>
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
            {/* Media Gallery Section */}
            <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
              {(product.media ?? []).length > 0 ? (
                <MediaGallery media={product.media ?? []} />
              ) : (
                <img
                  src={product.image_url || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-center object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.jpg';
                  }}
                />
              )}
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