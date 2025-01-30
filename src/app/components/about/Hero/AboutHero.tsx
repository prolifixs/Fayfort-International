'use client'

import { MotionDiv } from '@/app/components/about/shared/MotionDiv'

export function AboutHero() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Revolutionizing</span>
            <span className="block text-blue-600">Product Sourcing</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            We're building the future of B2B commerce with AI-powered solutions that connect businesses with reliable suppliers worldwide.
          </p>
        </MotionDiv>
      </div>
    </section>
  )
} 