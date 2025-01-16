'use client'

import { DashboardNotifications } from '../components/dashboard/DashboardNotifications'
import { ActivityFeed } from '../components/activities/ActivityFeed'
import { RequestFlow } from '../components/dashboard/RequestFlow'
import { UserRequestsTable } from '../components/dashboard/UserRequestsTable'
import RequestFormModal from '../components/RequestFormModal'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/useToast'
import { Database } from '@/app/components/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

export default function DashboardPage() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
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
      const { error } = await supabase
        .from('requests')
        .insert([{
          ...formData,
          status: 'pending'
        }])

      if (error) throw error

      setIsRequestFormOpen(false)
      toast({
        title: 'Request created',
        description: 'Your request has been submitted successfully',
        variant: 'success'
      })
    } catch (error) {
      console.error('Error creating request:', error)
      toast({
        title: 'Error creating request',
        description: 'Please try again later',
        variant: 'destructive'
      })
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
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
                  <div className="max-h-[300px] overflow-y-auto pr-2">
                    <ActivityFeed />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                {selectedRequestId ? (
                  <RequestFlow requestId={selectedRequestId} />
                ) : (
                  <div className="bg-white shadow rounded-lg p-6">
                    <p className="text-gray-500 text-center">
                      Select a request to view details
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">My Requests</h2>
              <UserRequestsTable />
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