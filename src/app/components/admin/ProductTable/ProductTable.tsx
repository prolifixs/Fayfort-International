'use client'

import { useState } from 'react'
import { ProductWithRequests, TableRow } from '@/app/components/types/database.types'
import { MediaService } from '@/services/MediaService'
import { supabase } from '../../lib/supabase'
import { StatusDropdown } from './StatusDropdown'
import { ProductTableHeader } from '@/app/components/admin/ProductTable/ProductTableHeader'
import { MediaPreviewModal } from '@/app/components/admin/ProductTable/MediaPreviewModal'
import { ProductTableRow } from '@/app/components/admin/ProductTable/ProductTableRow'

type ProductMedia = TableRow<'product_media'>
type Category = TableRow<'categories'>
type Product = TableRow<'products'> & {
  media?: ProductMedia[]
  category?: Category
}

interface ProductTableProps {
  products: ProductWithRequests[]
  view: 'active' | 'inactive'
  onEdit?: ((product: Product | undefined) => void)
  onDelete?: (product: Product) => void
  selectedProducts?: string[]
  onSelectProduct?: (productId: string) => void
  onSelectAll?: () => void
  onStatusChange: (productId: string, newStatus: 'active' | 'inactive') => Promise<void>
  loading?: boolean
  renderActions?: (product: ProductWithRequests) => React.ReactNode
}

export function ProductTable({ 
  products, 
  view, 
  onEdit, 
  onDelete,
  selectedProducts = [],
  onSelectProduct,
  onSelectAll,
  onStatusChange,
  loading,
  renderActions
}: ProductTableProps) {
  console.log('selectedProducts:', selectedProducts);

  const [previewMedia, setPreviewMedia] = useState<ProductMedia[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleDelete = async (product: Product) => {
    try {
      if (product.media?.length) {
        const mediaService = new MediaService(supabase)
        for (const media of product.media) {
          await mediaService.deleteMedia(media.id)
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100))
      onDelete?.(product)
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200">
        <ProductTableHeader 
          selectedCount={selectedProducts.length}
          totalCount={products.length}
          onSelectAll={onSelectAll}
          view={view}
        />
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <ProductTableRow
              key={product.id}
              product={product}
              isSelected={selectedProducts.includes(product.id)}
              onSelect={onSelectProduct}
              onEdit={onEdit}
              onDelete={handleDelete}
              onPreview={(media) => {
                setPreviewMedia(media)
                setIsPreviewOpen(true)
              }}
              onStatusChange={onStatusChange}
              view={view}
              renderActions={renderActions}
            />
          ))}
        </tbody>
      </table>

      <MediaPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        media={previewMedia}
      />
    </>
  )
} 