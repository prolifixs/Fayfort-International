'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'


interface TestimonialCardProps {
  testimonial: {
    name: string
    role: string
    company: string
    image: string
    content: string
    rating: number
  }
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative h-16 w-16">
          <Image
            src={testimonial.image}
            alt={testimonial.name}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{testimonial.name}</h3>
          <p className="text-sm text-gray-600">{testimonial.role}</p>
          <p className="text-sm text-gray-500">{testimonial.company}</p>
        </div>
      </div>
      <div className="flex mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
        ))}
      </div>
      <p className="text-gray-600 italic">&ldquo;{testimonial.content}&rdquo;</p>
    </div>
  )
} 