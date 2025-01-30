'use client'

import { RequestStatus, TableRow, User } from '@/app/components/types/database.types'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import StatusDropdown from './StatusDropdown'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'

type Request = TableRow<'requests'> & {
  user: User
  resolution_status: RequestStatus
  invoice_status: 'paid' | 'unpaid'
  notification_sent: boolean
}

interface ResolutionTableProps {
  requests: Request[]
  selectedRequests: string[]
  onSelectRequest: (requestIds: string) => void
  onDeleteRequest: (requestId: string, productId: string) => void
  onStatusChange: (requestId: string, type: 'resolution' | 'invoice', status: string) => Promise<void>
  productId: string
}

const RESOLUTION_STATUSES = ['pending', 'notified', 'resolved'];
const INVOICE_STATUSES = ['paid', 'unpaid'];

export function ResolutionTable({ 
  requests, 
  selectedRequests, 
  onSelectRequest,
  onDeleteRequest,
  onStatusChange,
  productId
}: ResolutionTableProps) {
  const [deletedRequests, setDeletedRequests] = useState<Set<string>>(new Set())
  const supabase = createClientComponentClient()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectRequest(requests.map(req => req.id).join(','));
    } else {
      onSelectRequest('');
    }
  };

  const getInvoiceStatusBadge = (status: 'paid' | 'unpaid') => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                checked={selectedRequests.length === requests.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Resolution Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {requests.map((request) => (
            <tr key={request.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  checked={selectedRequests.includes(request.id)}
                  onChange={() => onSelectRequest(request.id)}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {request.user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(request.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusDropdown
                  requestId={request.id}
                  currentStatus={request.resolution_status}
                  statusType="resolution"
                  options={RESOLUTION_STATUSES}
                  onStatusUpdate={onStatusChange}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusDropdown
                  requestId={request.id}
                  currentStatus={request.invoice_status}
                  statusType="invoice"
                  options={INVOICE_STATUSES}
                  onStatusUpdate={onStatusChange}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    console.log('Delete button clicked for request:', request.id)
                    const { data, error } = await supabase
                      .from('requests')
                      .select('id')
                      .eq('id', request.id)
                      .single()
                    
                    console.log('Supabase check result:', { data, error })
                      
                    if (!data) {
                      console.log('Request not found, marking as deleted')
                      setDeletedRequests(prev => new Set(prev).add(request.id))
                      toast('Request was already deleted by the user', {
                        icon: 'ℹ️'
                      })
                      return
                    }
                    
                    console.log('Calling onDeleteRequest')
                    onDeleteRequest(request.id, productId)
                  }}
                  disabled={deletedRequests.has(request.id)}
                >
                  {deletedRequests.has(request.id) ? 'Deleted' : 'Delete'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}