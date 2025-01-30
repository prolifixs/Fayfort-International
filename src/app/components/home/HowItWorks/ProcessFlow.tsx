'use client'

import { StepCard } from './StepCard'
import { motion } from 'framer-motion'
import { Search, ShoppingCart, MessageCircle, CreditCard } from 'lucide-react'


const steps = [
  {
    icon: <Search className="h-6 w-6 text-blue-500" />,
    title: "Browse Products",
    description: "Explore our extensive catalog of products across various categories"
  },
  {
    icon: <ShoppingCart className="h-6 w-6 text-green-500" />,
    title: "Submit Request",
    description: "Create a detailed request for the products you're interested in"
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-purple-500" />,
    title: "AI Assistance",
    description: "Get instant support via WhatsApp for any queries or updates"
  },
  {
    icon: <CreditCard className="h-6 w-6 text-orange-500" />,
    title: "Complete Purchase",
    description: "Secure payment processing and order confirmation"
  }
]

export function ProcessFlow() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-4 text-lg text-gray-600">Simple steps to start sourcing products with us</p>
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 transform -translate-y-1/2 hidden md:block" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 