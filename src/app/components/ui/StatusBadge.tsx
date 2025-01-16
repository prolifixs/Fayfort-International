import { cn } from '@/app/components/lib/utils'
import { motion } from 'framer-motion'

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'processing'

interface StatusBadgeProps {
  status: string
  className?: string
  showIcon?: boolean
}

const statusStyles: Record<RequestStatus, { bg: string; text: string; icon: JSX.Element }> = {
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
  }
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  // Add null check for status
  if (!status) return null;
  
  const style = statusStyles[status.toLowerCase() as RequestStatus] || 
    { bg: 'bg-gray-100', text: 'text-gray-800' }
  
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-medium capitalize inline-flex items-center gap-1.5',
        style.bg,
        style.text,
        className
      )}
    >
      {status}
    </motion.span>
  )
} 