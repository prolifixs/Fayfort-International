'use client'

import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { StatusBadge } from '../ui/StatusBadge'
import { Badge } from '../ui/badge'
import type { UserRequest } from './UserRequestsTable'

interface RequestListItemProps {
  request: UserRequest
  onView: (id: string) => void
  onDelete: (id: string) => void
  canDelete: boolean
}

export function RequestListItem({ request, onView, onDelete, canDelete }: RequestListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div 
      className="border-b border-gray-200 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{request.product.name}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <StatusBadge status={request.status} type="request" />
            {request.product.status === 'inactive' && request.resolution_status && (
              <StatusBadge status={request.resolution_status} type="resolution" />
            )}
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-4 space-y-3"
        >
          <div className="text-sm text-gray-500">
            Created: {new Date(request.created_at).toLocaleDateString()}
          </div>
          {request.notification_sent && (
            <Badge variant="outline">
              {request.notification_type?.replace('_', ' ')}
            </Badge>
          )}
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => onView(request.id)}>
              View Details
            </Button>
            {canDelete && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onDelete(request.id)}
              >
                Delete
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
} 