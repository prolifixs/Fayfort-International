'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { clientWebsocketService, ConnectionStatus } from '@/services/clientWebsocketService'
import { useToast } from '@/hooks/useToast'
import { Loader2, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react'
import { StatusBadge } from '../ui/StatusBadge'
import { Button } from '../ui/button'

interface UserRequest {
  id: string
  product_id: string
  customer_id: string
  status: string
  created_at: string
  product: {
    id: string
    name: string
  }
  customer: {
    id: string
    email: string
  }
  quantity: number
  budget: number
  invoice?: {
    id: string
    status: string
    amount: number
  }
}

interface SortConfig {
  field: keyof UserRequest | 'product.name'
  direction: 'asc' | 'desc'
}

const ITEMS_PER_PAGE = 10

export function UserRequestsTable() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState<SortConfig>({ field: 'created_at', direction: 'desc' })
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  async function fetchUserRequests() {
    try {
      setLoading(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          product_id,
          customer_id,
          status,
          created_at,
          quantity,
          budget,
          product:products!inner (
            id,
            name
          ),
          customer:users!requests_customer_id_fkey (
            id,
            email
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      console.log('Raw data:', data)

      if (error) throw error
      setRequests(data?.map(item => ({
        ...item,
        product: Array.isArray(item.product) ? item.product[0] : item.product || { id: item.product_id, name: 'No product name' },
        customer: Array.isArray(item.customer) ? item.customer[0] : item.customer
      })) || [])
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortConfig['field']) => {
    setSort(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Calculate pagination
  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE)
  const paginatedRequests = requests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        return await clientWebsocketService.subscribeToRequests({
          table: 'requests',
          filter: `customer_id=eq.${user.id}`,
          onUpdate: (payload) => {
            console.log('[Dashboard/UserRequestsTable] Websocket Update:', {
              type: payload.eventType,
              requestId: payload.new?.id,
              timestamp: new Date().toISOString()
            })
            
            if (payload.eventType === 'INSERT') {
              fetchUserRequests()
            } else if (payload.eventType === 'UPDATE') {
              setRequests(prev => {
                const updated = prev.map(request =>
                  request.id === payload.new.id ? { ...request, ...payload.new } : request
                )
                console.log('[Dashboard/UserRequestsTable] State Update:', {
                  previousCount: prev.length,
                  newCount: updated.length,
                  timestamp: new Date().toISOString()
                })
                return updated
              })
            }
          }
        })
      } catch (err) {
        console.error('Subscription setup error:', err)
      }
    }

    const unsubscribeStatus = clientWebsocketService.subscribeToStatus(setConnectionStatus)
    
    fetchUserRequests()
    const unsubscribeRequests = setupSubscription()

    return () => {
      unsubscribeStatus()
      unsubscribeRequests?.then(cleanup => cleanup?.())
    }
  }, [sort])

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        {error}
        <button 
          onClick={fetchUserRequests}
          className="ml-2 text-blue-600 hover:text-blue-800"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <AnimatePresence mode="wait">
        {!selectedRequestId ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Requests</h2>
              <div className="flex items-center space-x-2">
                {connectionStatus !== 'connected' && (
                  <span className="text-sm text-gray-500">
                    {connectionStatus === 'connecting' ? 'Connecting...' : 'Connection lost'}
                  </span>
                )}
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('product.name')}
                    >
                      Product
                      {sort.field === 'product.name' && (
                        sort.direction === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {sort.field === 'status' && (
                        sort.direction === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                      {sort.field === 'created_at' && (
                        sort.direction === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.map((request) => (
                    <tr 
                      key={request.id}
                      onClick={() => setSelectedRequestId(request.id)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.product?.name || 'No product name'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {requests.length === 0 && !loading && (
                <div className="text-center py-4 text-gray-500">
                  No requests found
                </div>
              )}

              {totalPages > 1 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRequestId(null)}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Requests
              </Button>
            </div>
            <RequestDetails requestId={selectedRequestId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RequestDetails({ requestId }: { requestId: string }) {
  const [details, setDetails] = useState<UserRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('requests')
          .select(`
            *,
            product:products(name),
            invoice:invoices(id, status, amount)
          `)
          .eq('id', requestId)
          .single()

        if (error) throw error
        setDetails(data)
      } catch (error) {
        console.error('Error fetching request details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [requestId])

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (!details) {
    return <div>Request not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Status</label>
          <div className="mt-1">
            <StatusBadge status={details.status} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Created</label>
          <div className="mt-1 text-sm">
            {new Date(details.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-500">Product</label>
        <div className="mt-1 text-sm">{details.product.name}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Quantity</label>
          <div className="mt-1 text-sm">{details.quantity}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Budget</label>
          <div className="mt-1 text-sm">${details.budget}</div>
        </div>
      </div>

      {details.invoice && (
        <div className="border-t pt-4">
          <label className="text-sm font-medium text-gray-500">Invoice</label>
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm">#{details.invoice.id}</span>
              <StatusBadge status={details.invoice.status} />
            </div>
            <div className="mt-2 text-sm font-medium">
              Amount: ${details.invoice.amount}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 