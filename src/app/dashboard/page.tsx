'use client'

import { DashboardNotifications } from '../components/dashboard/DashboardNotifications'
import { RequestFlow } from '../components/dashboard/RequestFlow'
import { UserRequestsTable } from '../components/dashboard/UserRequestsTable'
import RequestFormModal from '../components/dashboard/RequestFormModal'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/useToast'
import { Database } from '@/app/components/types/database.types'
import { NewArrivals } from '@/app/components/catalog/NewArrivals'
import { useRouter } from 'next/navigation'
import { FayfayAIPreview } from '../components/dashboard/FayfayAIPreview'
import { RequestTabs } from '../components/admin/RequestTabs'

type Product = Database['public']['Tables']['products']['Row']

export default function DashboardPage() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const router = useRouter()

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: newStatus,
          resolution_status: 'resolved'
        })
        .eq('id', requestId)
  
      if (error) throw error
      
      toast({
        title: 'Status updated',
        description: `Request status changed to ${newStatus}`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error updating status',
        description: 'Please try again later',
        variant: 'destructive'
      })
    }
  }

  const handleNewRequest = async (formData: any) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .insert([{
          ...formData,
          status: 'pending'
        }])
        .select()
        .single();
  
      if (error || !data) throw new Error('Failed to create request');
  
      setIsRequestFormOpen(false)
      toast({
        title: 'Request created',
        description: 'Your request has been submitted successfully',
        variant: 'success'
      })
      return { id: data.id as string };
    } catch (error) {
      console.error('Error creating request:', error)
      toast({
        title: 'Error creating request',
        description: 'Please try again later',
        variant: 'destructive'
      })
      throw new Error('Failed to create request');
    }
  }

  const handleSort = (field: string) => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsRequestFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                New Request
              </button>
              <DashboardNotifications />
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Activity and Request Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Exchange Rates</h2>
                  <div className="max-h-[300px] overflow-y-auto pr-2">
                    {/* Activity content will be replaced */}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                {selectedRequestId ? (
                  <RequestFlow requestId={selectedRequestId} />
                ) : (
                  <FayfayAIPreview />
                )}
              </div>
            </div>

            {/* New Arrivals Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">New Products</h2>
                <button
                  onClick={() => router.push('/catalog')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All →
                </button>
              </div>
              <NewArrivals />
            </div>

            {/* Requests Tabs */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">My Requests</h2>
              </div>
              <RequestTabs />
            </div>
          </div>
        </div>
      </div>

      {/* Request Form Modal */}
      {isRequestFormOpen && (
        <RequestFormModal
          isOpen={isRequestFormOpen}
          onClose={() => setIsRequestFormOpen(false)}
          onSubmit={handleNewRequest}
          product={selectedProduct}
        />
      )}
    </div>
  )
} 