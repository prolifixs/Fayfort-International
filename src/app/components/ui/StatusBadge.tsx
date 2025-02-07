import { cn } from '@/app/components/lib/utils'
import { motion } from 'framer-motion'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  InboxIcon, 
  TruckIcon,
  DocumentIcon 
} from '@heroicons/react/24/outline'

export type RequestStatus = 'pending' | 'approved' | 'fulfilled' | 'shipped'
export type ProductStatus = 'active' | 'inactive'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'
export type ResolutionStatus = 'pending' | 'notified' | 'resolved'
export type AllStatus = RequestStatus | ProductStatus | InvoiceStatus | ResolutionStatus

export type ProductBadgeStatus = 'active' | 'inactive'
export type ResolutionBadgeStatus = 'pending' | 'notified' | 'resolved'

interface StatusBadgeProps {
  status: ProductBadgeStatus | ResolutionBadgeStatus | RequestStatus | InvoiceStatus
  className?: string
  showIcon?: boolean
  type?: 'request' | 'product' | 'invoice' | 'resolution'
  showTimestamp?: boolean
  timestamp?: string
  label?: string | number
}

const statusStyles: Record<AllStatus, { bg: string; text: string; icon: JSX.Element }> = {
  // Request statuses
  pending: { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
  },
  approved: { 
    bg: 'bg-green-100', 
    text: 'text-green-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
  },
  fulfilled: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
  },
  shipped: { 
    bg: 'bg-purple-100', 
    text: 'text-purple-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
  },
  // Invoice statuses (added/modified)
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
  },
  sent: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
  },
  paid: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
  },
  cancelled: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
  },
  // Other existing statuses...
  active: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
  },
  notified: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
  },
  resolved: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
  }
};

const statusIcons = {
  pending: ClockIcon,
  approved: CheckCircleIcon,
  fulfilled: InboxIcon,
  shipped: TruckIcon,
  draft: DocumentIcon,
  // Add other icons as needed
};

// Add specific styles for product and resolution
const productStyles = {
  active: { 
    bg: 'bg-green-100', 
    text: 'text-green-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
  },
  inactive: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
  }
}

const resolutionStyles = {
  pending: { 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
  },
  notified: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
  },
  resolved: { 
    bg: 'bg-green-100', 
    text: 'text-green-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
  }
}

export function StatusBadge({ 
  status = 'pending',
  className, 
  showIcon = true,
  type = 'request',
  showTimestamp = false,
  timestamp,
  label
}: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.pending;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-start"
    >
      <span
        className={cn(
          'px-2.5 py-0.5 rounded-full text-xs font-medium capitalize inline-flex items-center gap-1.5',
          style.bg,
          style.text,
          className
        )}
      >
        {showIcon && style.icon}
        {type === 'resolution' ? `Resolution: ${status}` : status}
        {label && (
          <span className="ml-2 text-sm font-medium text-gray-500">
            {label}
          </span>
        )}
      </span>
      {showTimestamp && timestamp && (
        <span className="text-xs text-gray-500 mt-1">
          {new Date(timestamp).toLocaleDateString()}
        </span>
      )}
    </motion.div>
  );
} 