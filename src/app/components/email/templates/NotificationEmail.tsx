'use client'

import { Text } from '@react-email/components'
import { BaseEmail } from './BaseEmail'
import { Button, Alert, Section } from '../components'
import { EmailStyles } from './styles/EmailStyles'

interface NotificationEmailProps {
  userName: string
  subject: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  actionLink?: string
  actionText?: string
}

export function NotificationEmail({
  userName,
  subject,
  message,
  type = 'info',
  actionLink,
  actionText,
}: NotificationEmailProps) {
  return (
    <BaseEmail
      previewText={subject}
      title={subject}
    >
      <Text style={EmailStyles.text}>
        Hi {userName},
      </Text>

      <Section>
        <Alert type={type === 'info' ? 'success' : type}>
          {message}
        </Alert>

        {actionLink && actionText && (
          <Button href={actionLink} variant="primary">
            {actionText}
          </Button>
        )}
      </Section>

      <Text style={EmailStyles.text}>
        If you have any questions, please don't hesitate to contact our support team.
      </Text>
    </BaseEmail>
  )
} 