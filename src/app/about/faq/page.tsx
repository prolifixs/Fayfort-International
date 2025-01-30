'use client'

import { useState } from 'react'
import { FAQSearch } from '@/app/components/about/FAQ/FAQSearch'
import { FAQAccordion } from '@/app/components/about/FAQ/FAQAccordion'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <main className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Find answers to common questions about our services
          </p>
        </MotionDiv>

        <FAQSearch 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <FAQAccordion searchQuery={searchQuery} />
      </div>
    </main>
  )
} 