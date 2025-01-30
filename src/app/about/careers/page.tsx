import { JobList } from '@/app/components/about/Careers/JobList'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers | Fayfort Enterprise',
  description: 'Join our team at Fayfort Enterprise and help shape the future of B2B commerce.',
}

export default function CareersPage() {
  return (
    <main className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Join Our Team</h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Help us revolutionize the future of product sourcing and global trade
          </p>
        </div>
        <JobList />
      </div>
    </main>
  )
} 