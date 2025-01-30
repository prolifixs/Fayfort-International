'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Pagination from '@/app/components/Pagination';
import Toast from '@/app/components/Toast';
import type { ActiveProduct, Database, InactiveProduct, TableRow } from '@/app/components/types/database.types';
import { DeleteConfirmationModal } from '@/app/components/DeleteConfirmationModal';
import { ProductTable } from '@/app/components/ProductTable/ProductTable';
import { ProductForm, ProductFormData } from '@/app/components/ProductForm/ProductForm';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { MediaService } from '@/services/MediaService';
import { MediaUploadManager } from '@/services/MediaUploadManager';
import { ProductTabs } from '@/app/components/ProductTable/ProductTabs';
import { notificationService } from '@/services/notificationService';
import { ProductSort } from '@/app/components/ProductTable/ProductSort';
import { SortConfig, SortField, SortOrder } from '@/app/components/ProductTable/types'
import { InvoiceStatus } from '@/app/components/types/invoice'
import { CatalogGuide } from '@/app/components/admin/CatalogGuide';

type Product = TableRow<'products'> & {
  category?: TableRow<'categories'>
  media?: ProductMedia[]
  status: 'active' | 'inactive'
  availability: boolean
  requests?: TableRow<'requests'>[]
}
type ProductMedia = TableRow<'product_media'>
type Category = TableRow<'categories'>

type ToastMessage = { type: 'success' | 'error'; message: string } | null;

export default function CatalogManagement() {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          media:product_media(*),
          requests:requests(*),
          status
        `)
        .eq('status', activeTab);

      // Always apply created_at sort first
      query = query.order('created_at', { ascending: false });

      // Then apply user-defined sorts
      sortConfigs.forEach((config) => {
        const foreignKey = config.field === 'category_id' ? 'categories.name' : String(config.field);
        query = query.order(foreignKey, {
          ascending: config.order === 'asc',
          nullsFirst: false,
        });
      });

      const { data, error } = await query;
      
      if (error) throw error;
      
      const subscription = supabase
        .channel('product_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `status=eq.${activeTab}`
        }, handleRealtimeUpdate)
        .subscribe();

      setProducts(data || []);
      return () => { subscription.unsubscribe(); };
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [activeTab, sortConfigs]);

  // Handle real-time updates
  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'UPDATE') {
      setProducts(prev => prev.map(product => 
        product.id === payload.new.id ? { ...product, ...payload.new } : product
      ));
    }
  };

  // Effect to refetch when tab changes
  useEffect(() => {
    const cleanup = fetchProducts();
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, [activeTab, fetchProducts]);

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

  const handleEdit = (product: Product | undefined) => {
    setEditingProduct(product || null);
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
      prev.length === products.length ? [] : products.map(p => p.id)
    );
  };

  // Filter products based on search, category, and availability
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category?.id === categoryFilter;
    const matchesAvailability = availabilityFilter === 'all' || product.status === availabilityFilter;
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;

  // Pagination calculations
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  const handleStatusChange = async (productId: string, newStatus: 'active' | 'inactive') => {
    try {
      setLoading(true);
      
      // Find the product
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      // Update product status
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;
      
      // Create status history entry
      const { error: historyError } = await supabase
        .from('status_history')
        .insert({
          product_id: productId,
          old_status: product.status,
          new_status: newStatus,
          created_at: new Date().toISOString()
        });

      if (historyError) throw historyError;

      // Create notification
      await notificationService.createStatusChangeNotification(
        productId,
        product.status,
        newStatus,
        product.name
      );
      
      showToast('success', 'Product status updated successfully');
      await fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      showToast('error', 'Failed to update product status');
    } finally {
      setLoading(false);
    }
  };

  // Add this debug log
  useEffect(() => {
    console.log('CatalogManagement selectedProducts:', selectedProducts);
  }, [selectedProducts]);

  return (
    <div className="p-6">
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

      <ProductSort 
        onSort={handleSort}
        sortConfigs={sortConfigs}
      />
      
      <div className="mt-4">
        <ProductTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeProducts={products
            .filter(p => p.status === 'active')
            .map(p => ({
              ...p,
              requests: (p.requests || []).map(r => ({
                ...r,
                user: { id: r.customer_id, email: '', name: '', role: 'customer', status: 'active', last_login: null, created_at: '', updated_at: '' },
                invoice_status: 'unpaid',
                status: r.status
              }))
            } as ActiveProduct))}
          inactiveProducts={products
            .filter(p => p.status === 'inactive')
            .map(p => ({
              ...p,
              requests: (p.requests || []).map(r => ({
                ...r,
                user: { id: r.customer_id, email: '', name: '', role: 'customer', status: 'active', last_login: null, created_at: '', updated_at: '' },
                invoice_status: 'pending' as InvoiceStatus,
                resolution_status: r.resolution_status || 'pending',
                notification_sent: false
              }))
            } as InactiveProduct))}
          onStatusChange={handleStatusChange}
          activeCount={products.filter(p => p.status === 'active').length}
          inactiveCount={products.filter(p => p.status === 'inactive').length}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectedProducts={selectedProducts}
          onSelectProduct={toggleProductSelection}
          onSelectAll={toggleAllProducts}
        />
      </div>

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

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
        requestId=""
        productId={productToDelete?.id || ''}
        onDeleted={async () => { await fetchProducts(); }}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <CatalogGuide />
    </div>
  );
} 