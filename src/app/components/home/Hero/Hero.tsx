'use client'

import { SearchBar } from './SearchBar'
import { TrustBadges } from './TrustBadges'


export function Hero() {
  return (
    <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Source Products with Confidence
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your trusted partner for product sourcing and catalog management. Access thousands of verified suppliers and products.
          </p>
          <SearchBar />
          <div className="mt-8">
            <TrustBadges />
          </div>
        </div>
      </div>
    </div>
  )
} 