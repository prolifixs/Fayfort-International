'use client'

import { Text, Button, Section } from '@react-email/components'
import { BaseEmail } from './BaseEmail'
import { EmailStyles } from './styles/EmailStyles'

interface VerificationEmailProps {
  verificationLink: string
  name: string
  previewMode?: boolean
}

export function VerificationEmail({ verificationLink, name, previewMode = false }: VerificationEmailProps) {
  const previewText = 'Verify Your Email Address'

  return (
    <BaseEmail previewText={previewText} title="Verify Your Email Address">
      <Text style={EmailStyles.text}>
        Hi {name},
      </Text>

      <Text style={EmailStyles.text}>
        Thanks for signing up! Please verify your email address to complete your registration and access all features.
      </Text>

      <Section style={EmailStyles.buttonContainer}>
        <Button
          style={EmailStyles.button}
          href={previewMode ? '#' : verificationLink}
        >
          Verify Email Address
        </Button>
      </Section>

      <Section style={EmailStyles.detailsContainer}>
        <Text style={EmailStyles.detailText}>
          This verification link will expire in 24 hours.
          <br /><br />
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Section>

      <Text style={EmailStyles.footer}>
        Need help? Contact our support team.
      </Text>
    </BaseEmail>
  )
} 