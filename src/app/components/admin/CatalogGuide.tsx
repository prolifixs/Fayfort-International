'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const guideSteps = [
  {
    title: "Product Management",
    description: "Add, edit, or remove products from your catalog. Use bulk actions for multiple products.",
    icon: "📋"
  },
  {
    title: "Status Control",
    description: "Toggle products between active and inactive states. Inactive products won't appear in the main catalog.",
    icon: "🔄"
  },
  {
    title: "Search & Filter",
    description: "Use the search bar and filters to quickly find specific products by name, category, or availability.",
    icon: "🔍"
  },
  {
    title: "Media Management",
    description: "Upload and manage product images and documents. Supports drag-and-drop functionality.",
    icon: "🖼️"
  }
]

export function CatalogGuide() {
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

              <h2 className="text-2xl font-semibold mb-4">Catalog Management Guide</h2>
              
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