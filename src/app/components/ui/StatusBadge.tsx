import { cn } from '@/app/components/lib/utils'
import { motion } from 'framer-motion'
import { ClockIcon, CheckCircleIcon, XCircleIcon, InboxIcon, TruckIcon } from '@heroicons/react/24/outline'

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'processing' | 'shipped'
export type ProductStatus = 'active' | 'inactive'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'
export type ResolutionStatus = 'pending' | 'notified' | 'resolved'
export type AllStatus = RequestStatus | ProductStatus | InvoiceStatus | ResolutionStatus

interface StatusBadgeProps {
  status?: AllStatus
  className?: string
  showIcon?: boolean
  type?: 'request' | 'product' | 'invoice' | 'resolution'
  showTimestamp?: boolean
  timestamp?: string
}

const statusStyles = {
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
  rejected: { 
    bg: 'bg-red-100', 
    text: 'text-red-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
  },
  fulfilled: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
  },
  processing: { 
    bg: 'bg-purple-100', 
    text: 'text-purple-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
  },
  shipped: { 
    bg: 'bg-purple-100', 
    text: 'text-purple-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
  },
  // Product statuses
  active: { 
    bg: 'bg-green-100', 
    text: 'text-green-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
  },
  inactive: { 
    bg: 'bg-red-100', 
    text: 'text-red-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
  },
  // Invoice statuses
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
  // Resolution statuses
  notified: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
  },
  resolved: { 
    bg: 'bg-green-100', 
    text: 'text-green-800',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
  },
} as const;

const statusIcons = {
  pending: ClockIcon,
  approved: CheckCircleIcon,
  rejected: XCircleIcon,
  fulfilled: InboxIcon,
  shipped: TruckIcon
};

export function StatusBadge({ 
  status = 'pending',
  className, 
  showIcon = true,
  type = 'request',
  showTimestamp = false,
  timestamp
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
      </span>
      {showTimestamp && timestamp && (
        <span className="text-xs text-gray-500 mt-1">
          {new Date(timestamp).toLocaleDateString()}
        </span>
      )}
    </motion.div>
  );
} 