'use client'

import { motion } from 'framer-motion'

interface FeatureCardProps {
  feature: {

    icon: React.ReactNode
    title: string
    description: string
  }
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={item}
      className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
        {feature.icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
      <p className="text-gray-600">{feature.description}</p>
    </motion.div>
  )
} 