'use client'

import { useState } from 'react'
import { UserRequestsTable } from '@/app/components/dashboard/UserRequestsTable'
import RequestFormModal from '@/app/components/dashboard/RequestFormModal'
import { useToast } from '@/hooks/useToast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/app/components/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

export default function RequestsPage() {
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

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

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Requests</h1>
          <button
            onClick={() => setIsRequestFormOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            New Request
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <UserRequestsTable />
        </div>

        {isRequestFormOpen && (
          <RequestFormModal
            isOpen={isRequestFormOpen}
            onClose={() => setIsRequestFormOpen(false)}
            onSubmit={handleNewRequest}
            product={selectedProduct}
          />
        )}
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic' 