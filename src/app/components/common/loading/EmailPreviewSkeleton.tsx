export function EmailPreviewSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4 border rounded-lg">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded w-32"></div>
    </div>
  )
} 