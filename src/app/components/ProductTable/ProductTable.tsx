'use client'

import { useState, useEffect } from 'react'
import { TableRow } from '@/app/components/types/database.types'
import Image from 'next/image'
import { Dialog } from '@headlessui/react'
import { MediaService } from '@/services/MediaService'
import { supabase } from '../lib/supabase'

type ProductMedia = TableRow<'product_media'>
type Category = TableRow<'categories'>
type Product = TableRow<'products'> & {
  media?: ProductMedia[]
  category?: Category
}
type SortField = keyof Omit<Product, 'category' | 'media' | 'created_at' | 'updated_at'> | 'category_id';
type SortOrder = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  order: SortOrder
  priority: number
}

interface ProductTableProps {
  products: Product[]
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
  onSort?: (sorts: SortConfig[]) => void
  sortConfigs?: SortConfig[]
  selectedProducts: string[]
  onSelectProduct: (productId: string) => void
  onSelectAll: () => void
}

export function ProductTable({ 
  products, 
  onEdit, 
  onDelete,
  onSort,
  sortConfigs = [],
  selectedProducts,
  onSelectProduct,
  onSelectAll
}: ProductTableProps) {
  const [previewMedia, setPreviewMedia] = useState<ProductMedia[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [localSortConfigs, setLocalSortConfigs] = useState<SortConfig[]>(sortConfigs)
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Load sort preferences from localStorage
    const savedSortConfigs = localStorage.getItem('productTableSort')
    if (savedSortConfigs) {
      try {
        const configs = JSON.parse(savedSortConfigs)
        // Validate that no config uses 'category' instead of 'category_id'
        const validConfigs = configs.map((config: { field: string; order: SortOrder; priority: number }) => ({
          ...config,
          field: config.field === 'category' ? 'category_id' : config.field
        }))
        setLocalSortConfigs(validConfigs)
        onSort?.(validConfigs)
      } catch (e) {
        console.error('Error parsing saved sort configs:', e)
        localStorage.removeItem('productTableSort')
      }
    }
  }, [])

  const getPrimaryMedia = (product: Product) => {
    console.log('🖼️ Getting primary media for:', {
      productId: product.id,
      mediaCount: product.media?.length,
      mediaUrls: product.media?.map(m => m.url)
    });

    if (!product.media || product.media.length === 0) {
      console.log('❌ No media found for product:', product.id);
      return null;
    }
    
    const media = product.media.find(m => m.is_primary) || product.media[0];
    
    if (!media.url.includes('supabase.co/storage')) {
      console.log('⚠️ Invalid media URL:', media.url);
      return null;
    }
    
    console.log('✅ Primary media found:', media.url);
    return media;
  };

  const handleSort = (field: SortField, event: React.MouseEvent) => {
    const newSortConfigs = [...localSortConfigs]
    const existingIndex = newSortConfigs.findIndex(config => config.field === field)

    if (event.shiftKey) {
      // Multi-column sort
      if (existingIndex === -1) {
        newSortConfigs.push({
          field,
          order: 'asc',
          priority: newSortConfigs.length + 1
        })
      } else {
        newSortConfigs[existingIndex].order = 
          newSortConfigs[existingIndex].order === 'asc' ? 'desc' : 'asc'
      }
    } else {
      // Single column sort
      newSortConfigs.splice(0, newSortConfigs.length, {
        field,
        order: existingIndex === -1 ? 'asc' : 
          newSortConfigs[existingIndex].order === 'asc' ? 'desc' : 'asc',
        priority: 1
      })
    }

    // Save to localStorage
    localStorage.setItem('productTableSort', JSON.stringify(newSortConfigs))
    setLocalSortConfigs(newSortConfigs)
    onSort?.(newSortConfigs)
  }

  const getSortIndicator = (field: SortField) => {
    const config = localSortConfigs.find(c => c.field === field)
    if (!config) return null

    return (
      <span className="ml-2 flex items-center">
        {config.order === 'asc' ? '↑' : '↓'}
        {localSortConfigs.length > 1 && (
          <span className="ml-1 text-xs text-gray-400">{config.priority}</span>
        )}
      </span>
    )
  }

  const handleImageError = (mediaId: string) => {
    console.log('🚫 Image load error:', mediaId);
    setImageLoadErrors(prev => ({
      ...prev,
      [mediaId]: true
    }));
  };

  const handleDelete = async (product: Product) => {
    try {
      // First delete all media associated with the product
      if (product.media?.length) {
        const mediaService = new MediaService(supabase);
        for (const media of product.media) {
          await mediaService.deleteMedia(media.id);
        }
      }

      // Then delete the product
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure media deletion is complete
      onDelete?.(product);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Sort products locally
  const sortedProducts = [...products].sort((a, b) => {
    for (const config of localSortConfigs) {
      let comparison = 0;
      
      if (config.field === 'category_id') {
        const aName = a.category?.name || '';
        const bName = b.category?.name || '';
        comparison = aName.localeCompare(bName);
      } else {
        const aValue = a[config.field];
        const bValue = b[config.field];
        comparison = String(aValue).localeCompare(String(bValue));
      }

      if (comparison !== 0) {
        return config.order === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedProducts.length === products.length}
                onChange={onSelectAll}
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Media
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={(e) => handleSort('name', e)}
            >
              <div className="flex items-center">
                Name
                {getSortIndicator('name')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={(e) => handleSort('category_id', e)}
            >
              <div className="flex items-center">
                Category
                {getSortIndicator('category_id')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={(e) => handleSort('price_range', e)}
            >
              <div className="flex items-center">
                Price Range
                {getSortIndicator('price_range')}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedProducts.map((product) => {
            const primaryMedia = getPrimaryMedia(product)
            const mediaCount = product.media?.length || 0

            return (
              <tr key={product.id}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => onSelectProduct(product.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setPreviewMedia(product.media || [])
                        setIsPreviewOpen(true)
                      }}
                      className="relative group"
                    >
                      <div className="relative w-10 h-10">
                        {!primaryMedia && (
                          <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">No image</span>
                          </div>
                        )}
                        {primaryMedia?.media_type === 'image' && (
                          <>
                            <Image
                              src={primaryMedia.url}
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className={`rounded object-cover ${imageLoadErrors[primaryMedia.id] ? 'hidden' : ''}`}
                              onError={() => handleImageError(primaryMedia.id)}
                              priority={true}
                            />
                            {imageLoadErrors[primaryMedia.id] && (
                              <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-500">Load error</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {mediaCount > 1 && (
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {mediaCount}
                        </span>
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.category?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.price_range}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.availability 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.availability ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onEdit?.(product)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="grid grid-cols-3 gap-4">
              {previewMedia.map((media) => (
                <div key={media.id} className="relative aspect-square">
                  <Image
                    src={media.url}
                    alt=""
                    fill
                    className={`rounded object-cover ${imageLoadErrors[media.id] ? 'hidden' : ''}`}
                    onError={() => handleImageError(media.id)}
                    priority={true}
                  />
                  {imageLoadErrors[media.id] && (
                    <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">Load error</span>
                    </div>
                  )}
                  {media.is_primary && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
} 