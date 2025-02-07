'use client'

import { ProductWithRequests, TableRow } from '@/app/components/types/database.types'
import { StatusDropdown } from './StatusDropdown'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type ProductMedia = TableRow<'product_media'>
type Category = TableRow<'categories'>

interface ProductTableRowProps {
  product: ProductWithRequests
  isSelected: boolean
  onSelect?: (productId: string) => void
  onEdit?: (product: ProductWithRequests) => void
  onDelete?: (product: ProductWithRequests) => void
  onPreview: (media: ProductMedia[]) => void
  onStatusChange: (productId: string, newStatus: 'active' | 'inactive') => Promise<void>
  view: 'active' | 'inactive'
  renderActions?: (product: ProductWithRequests) => React.ReactNode
}

export function ProductTableRow({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onPreview,
  onStatusChange,
  view,
  renderActions
}: ProductTableRowProps) {
  const router = useRouter()

  return (
    <tr key={product.id}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect?.(product.id)}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="relative">
          <button
            onClick={() => product.media && onPreview(product.media)}
            className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100"
          >
            {product.media?.[0] && (
              <>
                <Image
                  src={product.media[0].url}
                  alt="Product image"
                  fill
                  className="object-cover"
                />
                {product.media.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-white text-xs font-medium">
                      +{product.media.length - 1}
                    </span>
                  </div>
                )}
              </>
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
        <StatusDropdown
          productId={product.id}
          currentStatus={product.status}
          onStatusChange={onStatusChange}
          disabled={view === 'inactive'}
        />
        {view === 'inactive' && (
          <div className="text-sm text-gray-500 mt-1">
            {new Date(product.updated_at).toLocaleDateString()}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {renderActions ? (
          renderActions(product)
        ) : (
          <div className="flex justify-end space-x-2">
            {/* Default actions */}
            <button onClick={() => onEdit?.(product)}>Edit</button>
            <button onClick={() => onDelete?.(product)}>Delete</button>
          </div>
        )}
      </td>
    </tr>
  )
} 