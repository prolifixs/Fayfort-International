export function NotificationSkeleton() {
  return (
    <div className="divide-y divide-gray-200">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 bg-gray-200 rounded-full" />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
              <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 