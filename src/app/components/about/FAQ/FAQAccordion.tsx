'use client'

import { useState } from 'react'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  id: number
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: 'How does your product sourcing service work?',
    answer: 'We connect you with reliable suppliers through our AI-powered platform. Simply submit your requirements, and we\'ll handle the sourcing process.',
    category: 'general'
  },
  {
    id: 2,
    question: 'What are your shipping options?',
    answer: 'We offer various shipping methods including air freight, sea freight, and express delivery, depending on your needs and location.',
    category: 'shipping'
  },
  {
    id: 3,
    question: 'How do you ensure product quality?',
    answer: 'We work with verified suppliers and conduct quality checks. All products meet international standards and specifications.',
    category: 'quality'
  }
]

export function FAQAccordion({ searchQuery = '' }) {
  const [openId, setOpenId] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {filteredFaqs.map((faq) => (
        <MotionDiv
          key={faq.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: faq.id * 0.1 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <button
            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">{faq.question}</span>
            <ChevronDown
              className={`w-5 h-5 text-gray-500 transition-transform ${
                openId === faq.id ? 'transform rotate-180' : ''
              }`}
            />
          </button>
          
          {openId === faq.id && (
            <div className="px-6 pb-4">
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          )}
        </MotionDiv>
      ))}
    </div>
  )
} 