import { RequestStatus, InvoiceStatus, ProductStatus, ResolutionStatus } from '@/app/components/types/invoice'
import { STATUS_MAPPINGS } from '@/services/statusService'

interface StatusBadgeProps {
  status: RequestStatus | InvoiceStatus | ProductStatus | ResolutionStatus
  type?: 'request' | 'invoice' | 'product' | 'resolution'
  label?: string | number
  showIcon?: boolean
  className?: string
  children?: React.ReactNode
}

export function StatusBadge({ status, type = 'request', label, showIcon, className }: StatusBadgeProps) {
  const getStatusColor = (status: RequestStatus | InvoiceStatus | ProductStatus | ResolutionStatus, type: 'request' | 'invoice' | 'product' | 'resolution') => {
    const colors = {
      request: {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-blue-100 text-blue-800',
        fulfilled: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        shipped: 'bg-purple-100 text-purple-800'
      },
      invoice: {
        draft: 'bg-gray-100 text-gray-800',
        sent: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
      },
      product: {
        // Add product-specific colors here
      },
      resolution: {
        // Add resolution-specific colors here
      }
    }
    return colors[type][status as keyof typeof colors[typeof type]] || 
      (type === 'request' ? colors.request.pending : colors.invoice.draft)
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status, type)} ${className || ''}`}>
      {status}
      {label && (
        <span className="ml-2 text-sm font-medium text-gray-500">
          {label}
        </span>
      )}
    </span>
  )
} 