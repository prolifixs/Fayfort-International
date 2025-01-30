'use client'

import { FeatureCard } from './FeatureCard'
import { MessageCircle, ShoppingCart, CreditCard, Truck, HelpCircle, Gift } from 'lucide-react'
import { motion } from 'framer-motion'


const features = [
  {
    icon: <MessageCircle className="h-6 w-6 text-blue-500" />,
    title: "WhatsApp Integration",
    description: "Connect with our AI assistant directly through WhatsApp for 24/7 support"
  },
  {
    icon: <ShoppingCart className="h-6 w-6 text-green-500" />,
    title: "Product Discovery",
    description: "Browse and search products, get recommendations, and check availability"
  },
  {
    icon: <CreditCard className="h-6 w-6 text-purple-500" />,
    title: "Payment Assistance",
    description: "Process payments, check status, and get invoice updates automatically"
  }
]

export function FeatureGrid() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose Fayfort Enterprise</h2>
          <p className="mt-4 text-lg text-gray-600">Experience seamless product sourcing with our innovative features</p>
        </div>
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  )
} 