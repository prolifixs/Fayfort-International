'use client'

import { useState } from 'react'
import { JobCard } from '@/app/components/about/Careers/JobCard'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { Search } from 'lucide-react'

const jobs = [
  {
    id: 1,
    title: 'Social Media Manager',
    department: 'Marketing',
    location: 'California, USA',
    type: 'Full-time',
    description: 'Join our marketing team to build the future of B2B commerce.',
    requirements: [
      'Experience with Social Media',
      'Strong understanding of Social Media Marketing',
      'Experience with Social Media Platforms'
    ]
  },
  {
    id: 2,
    title: 'Data Analyst',
    department: 'Data',
    location: 'California, USA',
    type: 'Full-time',
    description: 'Lead data strategy and development for our sourcing platform.',
    requirements: [
      'Experience in Data Analysis',
      'Strong analytical skills',
      'Excellent communication'
    ]
  }
]

export function JobList() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search positions..."
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-6">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
} 