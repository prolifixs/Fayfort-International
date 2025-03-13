'use client'

import { Text } from '@react-email/components'
import { BaseEmail } from './BaseEmail'
import { Button, Section } from '../components'
import { EmailStyles } from './styles/EmailStyles'

interface WelcomeEmailProps {
  userName: string
  verificationLink: string
}

export function WelcomeEmail({
  userName,
  verificationLink,
}: WelcomeEmailProps) {
  return (
    <BaseEmail
      previewText="Welcome to FayfortEnterprise! Please verify your email to get started."
      title={`Welcome, ${userName}!`}
    >
      <Section>
        <Text style={EmailStyles.text}>
          Thank you for joining FayfortEnterprise! We're excited to have you on board.
        </Text>

        <Text style={EmailStyles.text}>
          To get started, please verify your email address by clicking the button below:
        </Text>

        <Button href={verificationLink} variant="primary">
          Verify Email Address
        </Button>

        <Text style={EmailStyles.text}>
          This verification link will expire in 24 hours. If you didn't create an account,
          you can safely ignore this email.
        </Text>
      </Section>

      <Section style={{ backgroundColor: '#f9fafb' }}>
        <Text style={{ ...EmailStyles.text, fontWeight: '600' }}>
          What's next?
        </Text>
        <Text style={EmailStyles.text}>
          • Complete your profile<br />
          • Explore our services<br />
          • Submit your first request
        </Text>
      </Section>
    </BaseEmail>
  )
} 