'use client'

import { useRouter } from 'next/navigation'
import { RequestDetailsModal } from '@/app/components/RequestDetailsModal'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Requests
        </Button>

        <div className="bg-white shadow rounded-lg p-6">
          <RequestDetailsModal requestId={params.id} onClose={() => router.back()} />
        </div>
      </div>
    </div>
  )
} 