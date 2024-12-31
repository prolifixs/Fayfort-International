export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface SortOptions<T> {
  column: keyof T
  order: 'asc' | 'desc'
}

export interface BaseOptions<T> extends PaginationOptions {
  sort?: SortOptions<T>
} 