import { type SortConfig, type SortField } from '@/app/components/ProductTable/types'


interface ProductSortProps {
  onSort: (sorts: SortConfig[]) => Promise<void>
  sortConfigs: SortConfig[]
}

function getSortIndicator(field: SortField, sortConfigs: SortConfig[]) {
  const config = sortConfigs.find(c => c.field === field)
  if (!config) return null
  
  return (
    <span>
      {config.order === 'asc' ? '↑' : '↓'}
      {sortConfigs.length > 1 && <sup>{config.priority}</sup>}
    </span>
  )
}

export function ProductSort({ onSort, sortConfigs }: ProductSortProps) {
  const handleSort = (field: SortField, event: React.MouseEvent) => {
    const newSortConfigs = [...sortConfigs]
    const existingIndex = newSortConfigs.findIndex(config => config.field === field)

    if (event.shiftKey) {
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
      newSortConfigs.splice(0, newSortConfigs.length, {
        field,
        order: existingIndex === -1 ? 'asc' : 
          newSortConfigs[existingIndex].order === 'asc' ? 'desc' : 'asc',
        priority: 1
      })
    }

    localStorage.setItem('productTableSort', JSON.stringify(newSortConfigs))
    onSort(newSortConfigs)
  }

  return (
    <div className="flex gap-4 mb-4">
      <button onClick={(e) => handleSort('name', e)} className="sort-button">
        Sort by Name {getSortIndicator('name', sortConfigs)}
      </button>
      <button onClick={(e) => handleSort('category_id', e)} className="sort-button">
        Sort by Category {getSortIndicator('category_id', sortConfigs)}
      </button>
      <button onClick={(e) => handleSort('price_range', e)} className="sort-button">
        Sort by Price {getSortIndicator('price_range', sortConfigs)}
      </button>
    </div>
  )
} 