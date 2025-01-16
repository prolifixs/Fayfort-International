export function InvoiceDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="flex space-x-2">
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      {/* PDF Preview Placeholder */}
      <div className="h-[400px] bg-gray-200 rounded"></div>
    </div>
  )
} 