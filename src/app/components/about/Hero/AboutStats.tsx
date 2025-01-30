'use client'

import { MotionDiv } from '@/app/components/about/shared/MotionDiv'

const stats = [
  { id: 1, name: 'Active Users', value: '10,000+' },
  { id: 2, name: 'Products Sourced', value: '50,000+' },
  { id: 3, name: 'Countries Served', value: '25+' },
  { id: 4, name: 'Supplier Network', value: '1,000+' }
]

export function AboutStats() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <MotionDiv
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.id * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
              <p className="mt-2 text-sm font-medium text-gray-600">{stat.name}</p>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  )
} 