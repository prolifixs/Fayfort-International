'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { clientWebsocketService, ConnectionStatus } from '@/services/clientWebsocketService'
import { useToast } from '@/hooks/useToast'
import { Loader2, ChevronDown, ChevronUp, ChevronLeft, PlusCircle } from 'lucide-react'
import { StatusBadge, AllStatus, ResolutionStatus } from '../ui/StatusBadge'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useRouter } from 'next/navigation'
import { DeleteConfirmationModal } from '@/app/components/common/DeleteConfirmationModal'
import { RequestProcessingService } from '@/app/components/lib/requests/requestProcessor'
import { PaymentDialog } from '../payment/PaymentDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog"
import { toast } from 'react-hot-toast'
import { NotificationService } from '@/services/notificationService'


interface UserRequest {
  id: string
  product_id: string
  customer_id: string
  status: AllStatus
  resolution_status?: ResolutionStatus
  created_at: string
  product: {
    id: string
    name: string
    status: string
  }
  customer: {
    id: string
    email: string
  }
  quantity: number
  budget: number
  invoice?: {
    id: string
    status: AllStatus
    amount: number
    created_at: string
    due_date?: string
  } | null
  notification_sent: boolean
  notification_type: string
  last_notification_date: string
  tracking_number?: string
  carrier?: string
  shipping_date?: string
}

interface SortConfig {
  field: keyof UserRequest | 'product.name'
  direction: 'asc' | 'desc'
}

const ITEMS_PER_PAGE = 10

interface EmptyStateCardProps {
  onCreateRequest: () => void;
}

function EmptyStateCard({ onCreateRequest }: EmptyStateCardProps) {
  return (
    <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-white">
      <div className="space-y-6 max-w-sm mx-auto">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <PlusCircle className="h-8 w-8 text-blue-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Create Your First Request</h3>
          <p className="text-sm text-gray-500">
            Start by creating a request for the products you're interested in. Our team will help you find the best deals.
          </p>
        </div>

        <Button 
          onClick={onCreateRequest}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Request
        </Button>
      </div>
    </div>
  );
}

interface RequestStatus {
  status: string;
  notification_sent: boolean;
  resolution_status: string;
  product: {
    status: 'active' | 'inactive';
  };
}

// Add or update the invoice type definition
type Invoice = {
  id: string
  status: AllStatus
  amount: number
  created_at: string
  due_date?: string
}



export function UserRequestsTable() {
  const router = useRouter()
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState<SortConfig>({ field: 'created_at', direction: 'desc' })
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const requestProcessor = new RequestProcessingService()
  const [showShippedDeleteModal, setShowShippedDeleteModal] = useState(false)

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
        resolution_status,
        created_at,
        quantity,
        budget,
        notification_sent,
        notification_type,
        last_notification_date,
        product:products!requests_product_id_fkey (
          id,
          name,
          status
        ),
        customer:users!requests_customer_id_fkey (
          id,
          email
        )
      `)
      .eq('customer_id', user.id)
      .order(sort.field, { ascending: sort.direction === 'asc' })

      console.log('Raw data:', data)

      if (error) throw error
      setRequests(data?.map(item => ({
        ...item,
        resolution_status: item.resolution_status || 'pending',
        product: Array.isArray(item.product) ? item.product[0] : item.product,
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

  useEffect(() => {
    const channel = supabase
      .channel('request_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests'
        },
        (payload) => {
          setRequests(current =>
            current.map(request =>
              request.id === payload.new.id
                ? { ...request, ...payload.new }
                : request
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteClick = async (requestId: string) => {
    try {
      console.log('Starting delete check for request:', requestId);
      const { data, error } = await supabase
        .from('requests')
        .select(`
          status,
          resolution_status,
          product:products!requests_product_id_fkey (
            status
          )
        `)
        .eq('id', requestId)
        .single();

      if (error || !data) {
        console.error('Delete check error:', error);
        toast({
          title: "Error",
          description: "Failed to verify request status",
          variant: "destructive",
        });
        return;
      }

      // Handle shipped requests
      if (data.status === 'shipped') {
        setRequestToDelete(requestId);
        setShowShippedDeleteModal(true);
        return;
      }

      // Handle pending requests
      const productStatus = data.product?.[0]?.status || 'inactive';
      

      if (data.status !== 'pending' && productStatus === 'active') {
        toast({
          title: "Error",
          description: 'Only pending requests can be deleted for active products',
          variant: "destructive",
        });
        return;
      }

      // Show delete confirmation dialog
      setRequestToDelete(requestId);
      setShowDeleteModal(true);

    } catch (error) {
      console.error('Delete check error:', error);
      toast({
        title: "Error", 
        description: "Failed to verify request status",
        variant: "destructive",
      });
    }
  };


  const handleDeleteSuccess = async (requestId: string) => {
    toast({
      title: "Request deleted",
      description: "Your request has been successfully deleted",
      variant: "success",
    })
    fetchUserRequests() // Refresh the table
  }

  const handleCreateRequest = () => {
    router.push('/catalog')
  }

  const canDeleteRequest = (request: UserRequest) => {
    // Allow deletion for shipped requests regardless of product status
    if (request.status === 'shipped') {
      return true;
    }

    // Keep existing logic for other cases
    if (request.product.status === 'active') {
      return request.status === 'pending';
    } else {
      return request.resolution_status === 'resolved';
    }
  };

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
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.map((request) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={request.status} type="request" />
                          {request.product.status === 'inactive' && request.resolution_status && (
                            <StatusBadge 
                              status={request.resolution_status} 
                              type="resolution" 
                              className="ml-2"
                            />
                          )}
                          {request.notification_sent && (
                            <Badge variant="outline" className="ml-2">
                              {request.notification_type?.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.created_at && new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRequestId(request.id)}
                          >
                            View Details
                          </Button>
                          {canDeleteRequest(request) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(request.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {requests.length === 0 && !loading && (
                <div className="px-6 py-4">
                  <EmptyStateCard onCreateRequest={handleCreateRequest} />
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
      {showDeleteModal && requestToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setRequestToDelete(null);
          }}
          requestId={requestToDelete}
          onDeleted={async (requestId) => {
            try {
              // Delete related records in sequence
              const { error: historyError } = await supabase
                .from('status_history')
                .delete()
                .eq('request_id', requestId);
              
              if (historyError) throw historyError;

              const { error: invoiceError } = await supabase
                .from('invoices')
                .delete()
                .eq('request_id', requestId);
              
              if (invoiceError) throw invoiceError;

              const { error: requestError } = await supabase
                .from('requests')
                .delete()
                .eq('id', requestId);
              
              if (requestError) throw requestError;

              handleDeleteSuccess(requestId);
              setShowDeleteModal(false);
              setRequestToDelete(null);
            } catch (error) {
              console.error('Delete error:', error);
              toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete request",
                variant: "destructive",
              });
            }
          }}
          itemName="Request"
        />
      )}
      {showShippedDeleteModal && requestToDelete && (
        <ShippedDeleteConfirmationModal
          isOpen={showShippedDeleteModal}
          onClose={() => {
            setShowShippedDeleteModal(false);
            setRequestToDelete(null);
          }}
          onConfirm={async (requestId) => {
            try {
              console.log('Starting shipped request archival process:', requestId);

              // 1. Get request data
              const { data: requestData, error: requestError } = await supabase
                .from('requests')
                .select(`
                  *,
                  invoice:invoices(*),
                  product:products(name)
                `)
                .eq('id', requestId)
                .single();

              if (requestError || !requestData) {
                throw new Error(requestError?.message || 'Request not found');
              }

              // 2. Send notification first
              const notificationService = new NotificationService();
              await notificationService.sendStatusUpdateNotification(
                requestId,
                'shipped',
                {
                  previousStatus: requestData.status,
                  productName: requestData.product?.name
                }
              );

              // 3. Create archive record
              const { error: archiveError } = await supabase
                .from('archived_requests')
                .insert({
                  original_request_id: requestId,
                  status: requestData.status,
                  shipping_info: {
                    tracking_number: requestData.tracking_number,
                    carrier: requestData.carrier,
                    shipping_date: requestData.shipping_date
                  },
                  invoice_info: requestData.invoice,
                  archived_at: new Date().toISOString()
                });

              if (archiveError) throw archiveError;

              // 4. Delete related records last
              await supabase.from('status_history').delete().eq('request_id', requestId);
              await supabase.from('invoices').delete().eq('request_id', requestId);
              await supabase.from('requests').delete().eq('id', requestId);

              handleDeleteSuccess(requestId);
              console.log('Shipped request archived and deleted successfully:', requestId);
            } catch (error) {
              console.error('Error in shipped request deletion:', error);
              toast({
                title: "Error",
                description: "Failed to process shipped request deletion",
                variant: "destructive",
              });
            } finally {
              setShowShippedDeleteModal(false);
              setRequestToDelete(null);
            }
          }}
          requestId={requestToDelete}
        />
      )}
    </div>
  )
}

export function RequestDetails({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [details, setDetails] = useState<UserRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  useEffect(() => {
    fetchDetails()
    
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${requestId}`
        },
        () => fetchDetails()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `request_id=eq.${requestId}`
        },
        () => fetchDetails()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId])

  async function fetchDetails() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          product:products!requests_product_id_fkey (
            id,
            name,
            status
          ),
          invoice:invoices (
            id, 
            status, 
            amount,
            created_at,
            due_date
          )
        `)
        .eq('id', requestId)
        .single()

      if (error) throw error
      
      // Transform the data to match the expected structure
      const transformedData = {
        ...data,
        product: Array.isArray(data.product) ? data.product[0] : data.product,
        invoice: Array.isArray(data.invoice) ? data.invoice[0] : data.invoice
      }
      
      setDetails(transformedData)
    } catch (error) {
      console.error('Error fetching request details:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderInvoiceSection = () => {
    if (!details?.invoice) return null;

    return (
      <div className="border-t pt-4">
        <label className="text-sm font-medium text-gray-500">Invoice</label>
        <div className="mt-2 p-4 bg-gray-50 rounded-md space-y-4">
          {/* Header with ID and Status */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">#{details.invoice.id}</span>
            <div className="flex items-center gap-2">
              <StatusBadge 
                status={details.invoice.status} 
                type="invoice"
                showIcon 
              />
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Amount</div>
              <div className="text-gray-600">${details.invoice.amount}</div>
            </div>
            <div>
              <div className="font-medium">Status</div>
              <div className="text-gray-600">{details.invoice.status}</div>
            </div>
            {details.invoice.created_at && (
              <div>
                <div className="font-medium">Created</div>
                <div className="text-gray-600">
                  {new Date(details.invoice.created_at).toLocaleDateString()}
                </div>
              </div>
            )}
            {details.invoice.due_date && (
              <div>
                <div className="font-medium">Due Date</div>
                <div className="text-gray-600">
                  {new Date(details.invoice.due_date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => setIsPaymentOpen(true)}
              className="flex-1"
              disabled={details.invoice.status === 'paid'}
            >
              {details.invoice.status === 'paid' ? 'Paid' : 'Make Payment'}
            </Button>
            <Button
              variant="outline"
              onClick={() => details?.invoice?.id && router.push(`/dashboard/invoices/${details.invoice.id}`)}
            >
              View Details
            </Button>
          </div>
        </div>

        <PaymentDialog 
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          amount={details.invoice.amount}
          invoiceId={details.invoice.id}
        />
      </div>
    )
  }

  const renderShippingSection = () => {
    if (!details?.tracking_number || details.status !== 'shipped') return null;

    return (
      <div className="border-t pt-4">
        <label className="text-sm font-medium text-gray-500">Shipping Information</label>
        <div className="mt-2 p-4 bg-gray-50 rounded-md space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Tracking Number</label>
              <div className="mt-1 text-sm">{details.tracking_number}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Carrier</label>
              <div className="mt-1 text-sm">{details.carrier}</div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Shipped Date</label>
            <div className="mt-1 text-sm">
              {details.shipping_date && new Date(details.shipping_date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse bg-gray-200 h-6 w-1/4 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-20 w-full rounded"></div>
        <div className="animate-pulse bg-gray-200 h-20 w-full rounded"></div>
      </div>
    )
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

      {renderInvoiceSection()}
      {renderShippingSection()}
    </div>
  )
}

function ShippedDeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  requestId 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (requestId: string) => Promise<void>;
  requestId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClientComponentClient();

  const handleShippedRequestDeletion = async (requestId: string) => {
    try {
      setIsDeleting(true);
      
      // 1. Get request data
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select(`
          *,
          invoice:invoices(*),
          product:products(name)
        `)
        .eq('id', requestId)
        .single();

      if (requestError || !requestData) {
        throw new Error(requestError?.message || 'Request not found');
      }

      // 2. Send notification first
      const notificationService = new NotificationService();
      await notificationService.sendStatusUpdateNotification(
        requestId,
        'shipped',
        {
          previousStatus: requestData.status,
          productName: requestData.product?.name
        }
      );

      // 3. Create archive record
      const { error: archiveError } = await supabase
        .from('archived_requests')
        .insert({
          original_request_id: requestId,
          status: requestData.status,
          shipping_info: {
            tracking_number: requestData.tracking_number,
            carrier: requestData.carrier,
            shipping_date: requestData.shipping_date
          },
          invoice_info: requestData.invoice,
          archived_at: new Date().toISOString()
        });

      if (archiveError) throw archiveError;

      // 4. Delete related records last
      await supabase.from('status_history').delete().eq('request_id', requestId);
      await supabase.from('invoices').delete().eq('request_id', requestId);
      await supabase.from('requests').delete().eq('id', requestId);

      await onConfirm(requestId);
      
    } catch (error) {
      console.error('Error in shipped request deletion:', error);
      toast.error('Failed to process shipped request deletion');
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Shipped Request</DialogTitle>
          <DialogDescription>
            This request has been shipped and completed. It will be archived for record-keeping before deletion. Would you like to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => handleShippedRequestDeletion(requestId)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed with Deletion'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 