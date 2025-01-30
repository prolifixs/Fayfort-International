import { ProductTable } from '@/app/components/ProductTable/ProductTable'
import type { Product, ProductWithRequests } from '@/app/components/types/database.types'
import { useRouter } from 'next/navigation'

interface InactiveProductsTabProps {
  products: ProductWithRequests[]
  selectedProducts?: string[]
  onSelectProduct?: (productId: string) => void
  onSelectAll?: () => void
  onStatusChange: (productId: string, newStatus: 'active' | 'inactive') => Promise<void>
  loading?: boolean
}

export function InactiveProductsTab({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onStatusChange,
  loading
}: InactiveProductsTabProps) {
  const router = useRouter()

  const renderActions = (product: ProductWithRequests) => (
    <div className="flex space-x-2">
      <span className="text-gray-600">
        Requests: {product.requests?.length || 0}
      </span>
      <button
        onClick={() => router.push(`/components/product/resolution/${product.id}`)}
        className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Resolve
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Inactive Products</h2>
      </div>

      <ProductTable
        products={products}
        view="inactive"
        selectedProducts={selectedProducts}
        onSelectProduct={onSelectProduct}
        onSelectAll={onSelectAll}
        onStatusChange={onStatusChange}
        loading={loading}
        renderActions={renderActions}
      />
    </div>
  )
} 