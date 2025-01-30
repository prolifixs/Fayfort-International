'use client'

import { useState } from 'react'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { MapPin, Clock, ChevronDown } from 'lucide-react'

interface JobProps {
  job: {
    id: number
    title: string
    department: string
    location: string
    type: string
    description: string
    requirements: string[]
  }
}

export function JobCard({ job }: JobProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: job.id * 0.1 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
            <p className="text-blue-600 mt-1">{job.department}</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-500"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {job.location}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {job.type}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-gray-600">{job.description}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => window.location.href = `/about/careers/apply/${job.id}`}
              className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Now
            </button>
          </div>
        )}
      </div>
    </MotionDiv>
  )
} 