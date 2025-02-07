'use client';

import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import Pagination from '@/app/components/admin/Pagination';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import type { Database, TableRow } from '@/app/components/types/database.types';
import { ProductCard } from '@/app/components/common/ProductCard/ProductCard';
import { useRouter } from 'next/navigation';

type ProductMedia = TableRow<'product_media'>;

type Product = TableRow<'products'> & {
  category?: TableRow<'categories'>
  media?: ProductMedia[]
}

type Category = TableRow<'categories'>;

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const [categories, setCategories] = useState<Category[]>([]);

  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  // Real-time subscription setup
  useEffect(() => {
    const channel = supabase
      .channel('product_updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, 
        (payload) => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let query = supabase
        .from('products')
        .select(`
          *,
          media:product_media(*),
          categories!products_category_id_fkey (
            id,
            name
          )
        `);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);

      const uniqueCategories = Array.from(
        new Set(products.map(p => p.category))
      ).filter((category): category is Category => category !== null);
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  return (
    <ProtectedRoute allowedRoles={['customer', 'admin', 'supplier']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header and Filters */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Product Catalog</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border rounded-lg w-full"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 border rounded-lg w-full"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onClick={() => router.push(`/catalog/${product.id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}