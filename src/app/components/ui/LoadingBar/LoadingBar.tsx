'use client'

interface LoadingBarProps {
  progress: number
  message: string
  error?: string
}

export function LoadingBar({ progress, message, error }: LoadingBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{message}</span>
        <span className="text-sm font-medium text-gray-700">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${
            error ? 'bg-red-600' : 'bg-blue-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 