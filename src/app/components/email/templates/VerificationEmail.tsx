'use client'

import { Text } from '@react-email/components'
import { BaseEmail } from './BaseEmail'
import { Button, Alert, Section } from '../components'
import { EmailStyles } from './styles/EmailStyles'

interface VerificationEmailProps {
  userName: string
  verificationCode: string
  verificationLink: string
}

export function VerificationEmail({
  userName,
  verificationCode,
  verificationLink,
}: VerificationEmailProps) {
  return (
    <BaseEmail
      previewText="Verify your email address"
      title="Email Verification"
    >
      <Text style={EmailStyles.text}>
        Hi {userName},
      </Text>

      <Section>
        <Text style={EmailStyles.text}>
          Please verify your email address by clicking the button below:
        </Text>

        <Button href={verificationLink} variant="primary">
          Verify Email
        </Button>

        <Text style={EmailStyles.text}>
          Or enter this verification code:
        </Text>

        <Alert type="success">
          {verificationCode}
        </Alert>

        <Text style={EmailStyles.text}>
          This code will expire in 1 hour. If you didn't request this verification,
          please ignore this email.
        </Text>
      </Section>
    </BaseEmail>
  )
} 