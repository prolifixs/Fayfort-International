'use client'

import { Text } from '@react-email/components'
import { BaseEmail } from './BaseEmail'
import { Button, Alert, Section } from '../components'
import { EmailStyles } from './styles/EmailStyles'

interface PasswordResetEmailProps {
  userName: string
  resetLink: string
  resetCode?: string
}

export function PasswordResetEmail({
  userName,
  resetLink,
  resetCode,
}: PasswordResetEmailProps) {
  return (
    <BaseEmail
      previewText="Reset your password"
      title="Password Reset Request"
    >
      <Alert type="warning">
        We received a request to reset your password.
      </Alert>

      <Section>
        <Text style={EmailStyles.text}>
          Hi {userName},
        </Text>

        <Text style={EmailStyles.text}>
          Click the button below to reset your password:
        </Text>

        <Button href={resetLink} variant="primary">
          Reset Password
        </Button>

        {resetCode && (
          <>
            <Text style={EmailStyles.text}>
              Or use this reset code:
            </Text>
            <Alert type="success">
              {resetCode}
            </Alert>
          </>
        )}

        <Text style={EmailStyles.text}>
          This link will expire in 1 hour. If you didn't request a password reset,
          please ignore this email or contact support if you're concerned.
        </Text>
      </Section>
    </BaseEmail>
  )
} 