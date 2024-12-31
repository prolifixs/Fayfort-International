import LoadingSpinner from '../components/LoadingSpinner';

export default function CatalogLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
        <LoadingSpinner />
      </div>
      
      {/* Search and Filter Skeleton */}
      <div className="w-full h-12 bg-gray-200 animate-pulse rounded-lg"></div>
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-24 h-10 bg-gray-200 animate-pulse rounded-full"></div>
        ))}
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 