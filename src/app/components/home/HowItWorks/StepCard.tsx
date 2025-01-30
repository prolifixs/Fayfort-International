'use client'

import { motion } from 'framer-motion'

interface StepCardProps {
  step: {

    icon: React.ReactNode
    title: string
    description: string
  }
  index: number
}

export function StepCard({ step, index }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
      className="relative"
    >
      <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 mx-auto">
          {step.icon}
        </div>
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm md:block hidden">
          {index + 1}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{step.title}</h3>
        <p className="text-gray-600 text-center">{step.description}</p>
      </div>
    </motion.div>
  )
} 