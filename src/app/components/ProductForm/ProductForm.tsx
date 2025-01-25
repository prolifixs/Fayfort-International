'use client'

import { useState, useEffect } from 'react'
import { TableRow } from '@/app/components/types/database.types'
import { MediaUploader } from '@/app/components/MediaUploader/MediaUploader'
import { CategoryService } from '@/services/CategoryService'
import { toast } from 'react-hot-toast'
import { LoadingBar } from '@/app/components/LoadingBar/LoadingBar'

type Product = TableRow<'products'> & {
  media?: ProductMedia[]
  category?: Category
}
type ProductMedia = TableRow<'product_media'>
type Category = TableRow<'categories'>

interface ProductFormProps {
  initialProduct?: Product
  onSubmit: (data: ProductFormData) => Promise<void>
}

export type ProductFormData = Omit<TableRow<'products'>, 'id' | 'created_at' | 'updated_at'> & {
  media?: ProductMedia[]
  specifications?: Record<string, any>
  tempId?: string
}

interface LoadingState {
  progress: number
  message: string
  error?: string
}

export function ProductForm({ initialProduct, onSubmit }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialProduct?.name || '',
    description: initialProduct?.description || null,
    category_id: initialProduct?.category_id || '',
    price_range: initialProduct?.price_range || '',
    availability: initialProduct?.availability ?? true,
    image_url: initialProduct?.image_url || null,
    media: initialProduct?.media || [],
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    progress: 0,
    message: ''
  })

  // Add a state for temporary ID when creating new product
  const [tempProductId] = useState(() => crypto.randomUUID())
  
  // Use tempProductId when initialProduct.id is not available
  const productId = initialProduct?.id || tempProductId

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const categoryService = new CategoryService()
      const cats = await categoryService.getCategories()
      setCategories(cats)
    } catch (error) {
      toast.error('Failed to load categories')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState({ progress: 0, message: 'Starting submission...' })
    
    try {
      // Validate form
      setLoadingState({ progress: 20, message: 'Validating form data...' })
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate validation
      
      // Prepare media
      setLoadingState({ progress: 40, message: 'Preparing media files...' })
      const formDataWithTemp = {
        ...formData,
        tempId: tempProductId,
      }
      
      // Submit form
      setLoadingState({ progress: 60, message: 'Saving product information...' })
      await onSubmit(formDataWithTemp)
      
      // Final steps
      setLoadingState({ progress: 100, message: 'Completing submission...' })
    } catch (error) {
      console.error('❌ Form submission error:', error)
      setLoadingState(prev => ({
        ...prev,
        error: 'Failed to save product. Please try again.'
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleMediaChange = (newMedia: Product['media']) => {
    const primaryMedia = newMedia?.find(m => m.is_primary) || newMedia?.[0];
    setFormData(prev => ({ 
      ...prev, 
      media: newMedia,
      image_url: primaryMedia?.url || null  // Convert undefined to null
    }));
    
    console.log('Media changed:', {
      newMedia,
      primaryMedia,
      updatedFormData: {
        ...formData,
        media: newMedia,
        image_url: primaryMedia?.url
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl mx-auto">
      {/* Basic Product Information */}
      <div className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({...formData, category_id: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="price_range" className="block text-sm font-medium text-gray-700">
            Price Range
          </label>
          <input
            type="text"
            id="price_range"
            value={formData.price_range}
            onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="availability"
            checked={formData.availability}
            onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="availability" className="ml-2 block text-sm text-gray-700">
            Available
          </label>
        </div>
      </div>

      {/* Media Uploader Integration */}
      <div className="col-span-2 max-h-[350px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Media
        </label>
        <div className="max-h-[300px] overflow-y-auto">
          <MediaUploader
            productId={productId}
            initialMedia={formData.media}
            onMediaChange={handleMediaChange}
          />
        </div>
      </div>

      {loading && (
        <div className="mb-4">
          <LoadingBar 
            progress={loadingState.progress}
            message={loadingState.message}
            error={loadingState.error}
          />
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  )
} 