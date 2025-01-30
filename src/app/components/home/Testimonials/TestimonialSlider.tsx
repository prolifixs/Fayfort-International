'use client'

import { TestimonialCard } from './TestimonialCard'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Business Owner",
    company: "Fashion Boutique",
    image: "/testimonials/sarah.jpg",
    content: "Fayfort Enterprise has transformed how we source products. Their AI-powered system makes everything seamless.",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Procurement Manager",
    company: "Tech Solutions Inc",
    image: "/testimonials/michael.jpg",
    content: "The WhatsApp integration is a game-changer. Quick responses and real-time updates make our work efficient.",
    rating: 5
  },
  {
    name: "Emma Davis",
    role: "Retail Director",
    company: "HomeStyle Co",
    image: "/testimonials/emma.jpg",
    content: "Outstanding service and product quality. The catalog system is intuitive and saves us countless hours.",
    rating: 5
  }
]

export function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">What Our Clients Say</h2>
          <p className="mt-4 text-lg text-gray-600">Trusted by businesses worldwide</p>
        </div>
        
        <div className="relative">
          <div className="flex items-center justify-between">
            <button 
              onClick={prevSlide}
              className="p-2 rounded-full bg-white shadow-lg hover:bg-gray-50"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            
            <div className="overflow-hidden mx-4">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <TestimonialCard testimonial={testimonials[currentIndex]} />
              </motion.div>
            </div>

            <button 
              onClick={nextSlide}
              className="p-2 rounded-full bg-white shadow-lg hover:bg-gray-50"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
} 