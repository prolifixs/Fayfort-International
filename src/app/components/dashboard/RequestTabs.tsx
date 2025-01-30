'use client'

import { useState } from 'react'
import { UserRequestsTable } from './UserRequestsTable'
import { FinanceRequestsTable } from './FinanceRequestsTable'
import { cn } from '@/app/components/lib/utils'




type TabType = 'product' | 'finance'

export function RequestTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('product')

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('product')}
            className={cn(
              'py-4 px-6 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'product'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Product Requests
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={cn(
              'py-4 px-6 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'finance'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Finance Requests
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'product' ? (
          <UserRequestsTable />
        ) : (
          <FinanceRequestsTable />
        )}
      </div>
    </div>
  )
} 