'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Pagination from '@/app/components/Pagination';
import Toast from '@/app/components/Toast';
import type { Database, TableRow } from '@/app/components/types/database.types';
import DeleteConfirmationModal from '@/app/components/DeleteConfirmationModal';
import { ProductTable } from '@/app/components/ProductTable/ProductTable';
import { ProductForm, ProductFormData } from '@/app/components/ProductForm/ProductForm';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { MediaService } from '@/services/MediaService';
import { MediaUploadManager } from '@/services/MediaUploadManager';

type Product = TableRow<'products'> & {
  category?: TableRow<'categories'>
  media?: ProductMedia[]
}
type ProductMedia = TableRow<'product_media'>
type Category = TableRow<'categories'>

type SortField = keyof Omit<Product, 'category' | 'media' | 'created_at' | 'updated_at'> | 'category_id';
type SortOrder = 'asc' | 'desc';
type ToastMessage = { type: 'success' | 'error'; message: string } | null;

interface SortConfig {
  field: SortField;
  order: SortOrder;
  priority: number;
}

export default function CatalogManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastMessage>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingState, setLoadingState] = useState({ progress: 0, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const productsPerPage = 10;
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchProducts();
  }, [sortConfigs]);

  useEffect(() => {
    const channel = supabase
      .channel('admin_products')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, 
        () => fetchProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (e) {
        console.error('Error fetching categories:', e);
        showToast('error', 'Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  async function fetchProducts() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      console.log('🔍 Starting product fetch...');
      let query = supabase
        .from('products')
        .select(`
          *,
          media:product_media(*),
          category:categories!products_category_id_fkey(*)
        `);

      // Apply filters
      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      if (availabilityFilter !== 'all') {
        query = query.eq('availability', availabilityFilter === 'active');
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Apply sorting
      sortConfigs.sort((a, b) => a.priority - b.priority);

      // Add default sort by created_at if no other sorts are specified
      if (sortConfigs.length === 0) {
        query = query.order('created_at', { ascending: false });
      } else {
        // Apply existing sort configs
        sortConfigs.forEach(config => {
          if (config.field === 'category_id') {
            query = query.order('categories!products_category_id_fkey(name)', { ascending: config.order === 'asc' });
          } else {
            query = query.order(config.field, { ascending: config.order === 'asc' });
          }
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      console.log('📦 Products fetched:', {
        count: data?.length,
        withMedia: data?.filter(p => p.media?.length > 0).length,
        mediaUrls: data?.map(p => p.media?.map((m: ProductMedia) => m.url))
      });
      
      setProducts(data || []);
    } catch (e) {
      console.error('❌ Error fetching products:', e);
      showToast('error', e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSort = async (newSortConfigs: SortConfig[]) => {
    console.log('🔄 Sort triggered with configs:', newSortConfigs);
    setSortConfigs(newSortConfigs);
    await fetchProducts();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      // First check if there are any related requests
      const { data: relatedRequests } = await supabase
        .from('requests')
        .select('id')
        .eq('product_id', productToDelete.id)
        .limit(1);

      if (relatedRequests && relatedRequests.length > 0) {
        showToast('error', 'Cannot delete product with existing requests');
        return;
      }

      // If no related requests, proceed with deletion
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      showToast('success', 'Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('error', 'Failed to delete product');
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;
      showToast('success', 'Products deleted successfully');
      setSelectedProducts([]);
      await fetchProducts();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to delete products');
    }
  };

  const handleProductSubmit = async (data: ProductFormData) => {
    if (!isSubmitting) {
      setIsSubmitting(true);
      setLoadingState({ progress: 0, message: 'Starting...' });
      
      try {
        let productId: string | undefined;

        // Create or update product
        if (editingProduct) {
          setLoadingState({ progress: 70, message: 'Updating product...' });
          const { error: productError } = await supabase
            .from('products')
            .update({
              name: data.name,
              description: data.description || null,
              price_range: data.price_range,
              category_id: data.category_id || null,
              availability: data.availability || false,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingProduct.id);
          
          if (productError) throw productError;
          productId = editingProduct.id;
        } else {
          setLoadingState({ progress: 70, message: 'Creating new product...' });
          const { data: newProduct, error: productError } = await supabase
            .from('products')
            .insert([{
              name: data.name,
              description: data.description || null,
              price_range: data.price_range,
              category_id: data.category_id || null,
              availability: data.availability || false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();
          
          if (productError) throw productError;
          productId = newProduct.id;
        }

        // Handle all media types
        if (data?.media?.length) {
          setLoadingState({ progress: 85, message: 'Processing media files...' });
          const uploadManager = new MediaUploadManager(supabase);
          
          for (const mediaItem of data.media) {
            if (mediaItem.id.startsWith('temp-')) {
              if (!productId) throw new Error('Product ID is required');
              await uploadManager.commitMedia(mediaItem, productId);
            }
          }
        }

        setLoadingState({ progress: 100, message: 'Completing...' });
        showToast('success', editingProduct ? 'Product updated successfully' : 'Product created successfully');
        await fetchProducts();
        setIsModalOpen(false);
      } catch (error) {
        console.error('Product submission error:', error);
        setLoadingState(prev => ({
          ...prev,
          error: 'Failed to save product. Please try again.'
        }));
        showToast('error', 'Failed to save product');
      } finally {
        setIsSubmitting(false);
        setLoadingState({ progress: 0, message: '' });
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleAllProducts = () => {
    setSelectedProducts(prev => 
      prev.length === currentProducts.length 
        ? [] 
        : currentProducts.map(p => p.id)
    );
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === 'all' || product.category_id === categoryFilter;
    
    const matchesAvailability = 
      availabilityFilter === 'all' || 
      (availabilityFilter === 'active' ? product.availability : !product.availability);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="p-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catalog Management</h1>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Selected ({selectedProducts.length})
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="p-2 border rounded-lg"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Product Table */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <ProductTable 
            products={currentProducts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSort={handleSort}
            sortConfigs={sortConfigs}
            selectedProducts={selectedProducts}
            onSelectProduct={toggleProductSelection}
            onSelectAll={toggleAllProducts}
          />
          
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {/* Product Form Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <ProductForm
              initialProduct={editingProduct || undefined}
              onSubmit={handleProductSubmit}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={productToDelete?.name || ''}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 