'use client'

import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { Search } from 'lucide-react'

interface FAQSearchProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function FAQSearch({ searchQuery, setSearchQuery }: FAQSearchProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto mb-12"
    >
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search frequently asked questions..."
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>
    </MotionDiv>
  )
} 