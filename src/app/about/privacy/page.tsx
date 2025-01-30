import { PrivacyContent } from '@/app/components/about/Privacy/PrivacyContent'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Fayfort Enterprise',
  description: 'Learn about how we collect, use, and protect your data at Fayfort Enterprise.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-12">Privacy Policy</h1>
        <PrivacyContent />
      </div>
    </main>
  )
} 