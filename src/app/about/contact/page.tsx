import { ContactForm } from '@/app/components/about/Contact/ContactForm'
import { ContactInfo } from '@/app/components/about/Contact/ContactInfo'
import { LocationMap } from '@/app/components/about/Contact/LocationMap'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Fayfort Enterprise',
  description: 'Get in touch with Fayfort Enterprise. We\'re here to help with your product sourcing needs.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-12">Get in Touch</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ContactForm />
          <div className="space-y-12">
            <ContactInfo />
            <LocationMap />
          </div>
        </div>
      </div>
    </main>
  )
} 