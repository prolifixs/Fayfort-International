'use client'

import { Text, Button, Section } from '@react-email/components'
import { BaseEmail } from './BaseEmail'
import { EmailStyles } from './styles/EmailStyles'

interface PasswordResetEmailProps {
  resetLink: string
  previewMode?: boolean
}

export function PasswordResetEmail({ resetLink, previewMode = false }: PasswordResetEmailProps) {
  const previewText = 'Reset Your Password'

  return (
    <BaseEmail previewText={previewText} title="Password Reset Request">
      <Text style={EmailStyles.text}>
        We received a request to reset your password. Click the button below to create a new password:
      </Text>

      <Section style={EmailStyles.buttonContainer}>
        <Button
          style={EmailStyles.button}
          href={previewMode ? '#' : resetLink}
        >
          Reset Password
        </Button>
      </Section>

      <Section style={EmailStyles.detailsContainer}>
        <Text style={EmailStyles.detailText}>
          If you didn't request this password reset, you can safely ignore this email.
          <br /><br />
          This link will expire in 1 hour for security purposes.
        </Text>
      </Section>

      <Text style={EmailStyles.footer}>
        For security reasons, never share this email or the reset link with anyone.
      </Text>
    </BaseEmail>
  )
} 