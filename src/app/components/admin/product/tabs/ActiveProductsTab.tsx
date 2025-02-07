import { ProductTable } from '@/app/components/admin/ProductTable/ProductTable'
import { ProductWithRequests } from '@/app/components/types/database.types'

interface ActiveProductsTabProps {
  products: ProductWithRequests[]
  onEdit: ((product: ProductWithRequests | undefined) => void) | undefined
  onDelete?: (product: ProductWithRequests) => void
  selectedProducts?: string[]
  onSelectProduct?: (productId: string) => void
  onSelectAll?: () => void
  onStatusChange: (productId: string, newStatus: 'active' | 'inactive') => Promise<void>
  loading?: boolean
}

export function ActiveProductsTab({
  products,
  onEdit,
  onDelete,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onStatusChange,
  loading
}: ActiveProductsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Active Products</h2>
        <button
          onClick={() => onEdit?.(undefined)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Product
        </button>
      </div>
      
      <ProductTable
        products={products}
        view="active"
        onEdit={onEdit}
        onDelete={onDelete}
        selectedProducts={selectedProducts}
        onSelectProduct={onSelectProduct}
        onSelectAll={onSelectAll}
        onStatusChange={onStatusChange}
        loading={loading}
      />
    </div>
  )
} 