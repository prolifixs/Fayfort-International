'use client'

interface NotificationFiltersProps {
  filter: 'all' | 'unread' | 'read'
  type: 'all' | 'status_change' | 'invoice_ready' | 'payment_received'
  onFilterChange: (filter: 'all' | 'unread' | 'read') => void
  onTypeChange: (type: 'all' | 'status_change' | 'invoice_ready' | 'payment_received') => void
}

export function NotificationFilters({
  filter,
  type,
  onFilterChange,
  onTypeChange,
}: NotificationFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
      <div className="flex space-x-4">
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as typeof filter)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="all">All Notifications</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as typeof type)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="all">All Types</option>
          <option value="status_change">Status Changes</option>
          <option value="invoice_ready">Invoices</option>
          <option value="payment_received">Payments</option>
        </select>
      </div>
    </div>
  )
} 