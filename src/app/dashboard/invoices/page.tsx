'use client'

import { useRouter } from 'next/navigation'
import { InvoiceList } from '@/app/components/common/invoice/InvoiceList'
import { ArrowLeft } from 'lucide-react'

export default function InvoicesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        <InvoiceList />
      </div>
    </div>
  )
} 