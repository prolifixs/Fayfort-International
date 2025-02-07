interface ProductTableHeaderProps {
  selectedCount: number | undefined
  totalCount: number
  onSelectAll?: () => void
  view: 'active' | 'inactive'
}

export function ProductTableHeader({ 
  selectedCount = 0,  // Add default value
  totalCount, 
  onSelectAll, 
  view 
}: ProductTableHeaderProps) {
  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left">
          <input
            type="checkbox"
            checked={selectedCount === totalCount && totalCount > 0}
            onChange={onSelectAll}
            className="rounded border-gray-300"
          />
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Media
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Category
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Price Range
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {view === 'inactive' ? 'Inactive Since' : 'Status'}
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  )
} 