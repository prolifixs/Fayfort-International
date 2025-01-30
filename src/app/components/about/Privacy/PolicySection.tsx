'use client'

import { MotionDiv } from '@/app/components/about/shared/MotionDiv'

interface PolicySectionProps {
  id: number
  title: string
  content: string
}

export function PolicySection({ id, title, content }: PolicySectionProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: id * 0.1 }}
      className="bg-white p-8 rounded-xl shadow-sm"
    >
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{content}</p>
    </MotionDiv>
  )
} 