'use client'

export function TrustBadges() {
  const stats = [
    { label: 'Active Users', value: '10K+' },
    { label: 'Products Sourced', value: '50K+' },
    { label: 'Satisfaction Rate', value: '99%' }

  ]

  return (
    <div className="flex justify-center space-x-8">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  )
} 