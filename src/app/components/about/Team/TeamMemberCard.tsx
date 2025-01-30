'use client'

import Image from 'next/image'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { Linkedin, Twitter, Github } from 'lucide-react'

interface TeamMemberProps {
  member: {
    id: number
    name: string
    role: string
    image: string
    bio: string
    linkedin?: string
    twitter?: string
    github?: string
  }
  index: number
}

export function TeamMemberCard({ member, index }: TeamMemberProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative h-64 w-full">
        <Image
          src={member.image}
          alt={member.name}
          fill
          className="object-cover"
        />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
        <p className="text-sm text-blue-600 mb-3">{member.role}</p>
        <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
        
        <div className="flex space-x-4">
          {member.linkedin && (
            <a 
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          )}
          {member.twitter && (
            <a 
              href={member.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
          )}
          {member.github && (
            <a 
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-900 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </MotionDiv>
  )
} 