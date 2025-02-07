'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const guideSteps = [
  {
    title: "Request Management",
    description: "View and manage product requests from customers. Filter by status and search for specific requests.",
    icon: "📋"
  },
  {
    title: "Status Updates",
    description: "Approve or reject requests. Status changes are automatically logged and notifications are sent.",
    icon: "✅"
  },
  {
    title: "Real-time Updates",
    description: "See request changes in real-time. The table updates automatically when requests are modified.",
    icon: "🔄"
  },
  {
    title: "Filtering & Sorting",
    description: "Use filters to find requests by date range, status, or search terms. Sort any column to organize data.",
    icon: "🔍"
  }
]

export function RequestGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Help Guide"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-white rounded-xl max-w-lg w-full p-6 relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-semibold mb-4">Request Management Guide</h2>
              
              <div className="space-y-6">
                {guideSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <span className="text-2xl">{step.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{step.title}</h3>
                      <p className="text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 