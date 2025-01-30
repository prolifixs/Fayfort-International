'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CallToAction() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center text-white"
        >
          <h2 className="text-4xl font-bold mb-6">Ready to Start Sourcing?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses who trust Fayfort Enterprise for their product sourcing needs
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/catalog"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors"
            >
              Browse Catalog
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link 
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-500 transition-colors"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-12 text-sm text-blue-100">
            <p>No commitment required • Free account setup • 24/7 support</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 