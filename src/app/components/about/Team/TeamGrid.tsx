'use client'

import { TeamMemberCard } from './TeamMemberCard'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'

const teamMembers = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Chief Executive Officer',
    image: '/team/sarah-chen.jpg',
    bio: 'Former VP of Operations at TechCorp, Sarah brings 15 years of experience in global supply chain management.',
    linkedin: 'https://linkedin.com/in/sarah-chen',
    twitter: 'https://twitter.com/sarahchen'
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    role: 'Chief Technology Officer',
    image: '/team/michael-rodriguez.jpg',
    bio: 'AI/ML expert with previous experience at major tech companies, leading our technical innovation.',
    linkedin: 'https://linkedin.com/in/michael-rodriguez',
    github: 'https://github.com/mrodriguez'
  },
  {
    id: 3,
    name: 'Aisha Patel',
    role: 'Head of Customer Success',
    image: '/team/aisha-patel.jpg',
    bio: 'Customer experience specialist focused on building long-term relationships and ensuring client satisfaction.',
    linkedin: 'https://linkedin.com/in/aisha-patel'
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Head of Product',
    image: '/team/david-kim.jpg',
    bio: 'Product strategist with a track record of launching successful B2B platforms.',
    linkedin: 'https://linkedin.com/in/david-kim',
    twitter: 'https://twitter.com/davidkim'
  }
]

export function TeamGrid() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900">Meet Our Team</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Dedicated professionals working to transform the future of product sourcing
          </p>
        </MotionDiv>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member, index) => (
            <TeamMemberCard 
              key={member.id} 
              member={member} 
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
} 