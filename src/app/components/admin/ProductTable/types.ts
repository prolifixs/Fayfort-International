import { TableRow, ProductWithRequests as DBProductWithRequests } from '@/app/components/types/database.types'

// Re-export the ProductWithRequests type
export type Product = DBProductWithRequests

export type SortField = keyof Omit<Product, 'media' | 'created_at' | 'updated_at' | 'category'> | 'category_id' | 'requests' | 'category'
export type SortOrder = 'asc' | 'desc'

export interface SortConfig {
  field: SortField
  order: SortOrder
  priority: number
} 