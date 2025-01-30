'use client'

import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { PolicySection } from '@/app/components/about/Privacy/PolicySection'

const privacyContent = [
  {
    id: 1,
    title: 'Data Collection',
    content: 'We collect information that you provide directly to us, including when you create an account, make a purchase, or contact us for support.'
  },
  {
    id: 2,
    title: 'User Rights',
    content: 'You have the right to access, correct, or delete your personal information. You can also opt out of marketing communications.'
  },
  {
    id: 3,
    title: 'Cookie Policy',
    content: 'We use cookies and similar technologies to provide and improve our services, including remembering your preferences and authentication.'
  },
  {
    id: 4,
    title: 'GDPR Compliance',
    content: 'We comply with GDPR requirements for users in the European Economic Area (EEA) and provide additional rights and protections.'
  }
]

export function PrivacyContent() {
  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="space-y-12">
        {privacyContent.map((section) => (
          <PolicySection key={section.id} {...section} />
        ))}
      </div>
    </MotionDiv>
  )
} 