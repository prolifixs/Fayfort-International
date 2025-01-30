'use client'

import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { MapPin, Phone, Mail, Clock, Globe } from 'lucide-react'

const contactDetails = {
  address: 'California, USA',
  phone: '+1 50 123 4567',
  email: 'contact@fayfortenterprise.com',
  hours: 'Mon-Fri: 9:00 AM - 6:00 PM (GST)',
  social: {
    whatsapp: 'https://wa.me/971501234567',
    linkedin: 'https://linkedin.com/company/fayfort-enterprise',
    instagram: 'https://instagram.com/fayfortenterprise'
  }
}

export function ContactInfo() {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-xl shadow-sm"
    >
      <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <MapPin className="w-6 h-6 text-blue-500 mt-1" />
          <div>
            <h3 className="font-medium text-gray-900">Address</h3>
            <p className="text-gray-600">{contactDetails.address}</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <Phone className="w-6 h-6 text-blue-500 mt-1" />
          <div>
            <h3 className="font-medium text-gray-900">Phone</h3>
            <a href={`tel:${contactDetails.phone}`} className="text-blue-600 hover:text-blue-700">
              {contactDetails.phone}
            </a>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <Mail className="w-6 h-6 text-blue-500 mt-1" />
          <div>
            <h3 className="font-medium text-gray-900">Email</h3>
            <a href={`mailto:${contactDetails.email}`} className="text-blue-600 hover:text-blue-700">
              {contactDetails.email}
            </a>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <Clock className="w-6 h-6 text-blue-500 mt-1" />
          <div>
            <h3 className="font-medium text-gray-900">Business Hours</h3>
            <p className="text-gray-600">{contactDetails.hours}</p>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
} 