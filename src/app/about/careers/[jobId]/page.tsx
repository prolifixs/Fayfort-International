import { ApplicationForm } from '@/app/components/about/Careers/ApplicationForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apply for Position | Fayfort Enterprise',
  description: 'Join our team at Fayfort Enterprise and help shape the future of B2B commerce.',
}

export default function ApplicationPage({ params }: { params: { jobId: string } }) {
  // In a real app, we would fetch the job details based on the jobId
  const jobTitle = "Senior Software Engineer" // This would come from your data

  return (
    <main className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ApplicationForm jobId={params.jobId} jobTitle={jobTitle} />
      </div>
    </main>
  )
} 