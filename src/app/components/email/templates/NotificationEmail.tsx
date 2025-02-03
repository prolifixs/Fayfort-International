'use client'

import { Text, Button, Section } from '@react-email/components'
import { BaseEmail } from './BaseEmail'
import { EmailStyles } from './styles/EmailStyles'

interface NotificationEmailProps {
  title: string
  message: string
  actionLabel?: string
  actionLink?: string
  additionalDetails?: string
  previewMode?: boolean
}

export function NotificationEmail({ 
  title, 
  message, 
  actionLabel, 
  actionLink, 
  additionalDetails,
  previewMode = false 
}: NotificationEmailProps) {
  return (
    <BaseEmail previewText={title} title={title}>
      <Text style={EmailStyles.text}>
        {message}
      </Text>

      {actionLabel && actionLink && (
        <Section style={EmailStyles.buttonContainer}>
          <Button
            style={EmailStyles.button}
            href={previewMode ? '#' : actionLink}
          >
            {actionLabel}
          </Button>
        </Section>
      )}

      {additionalDetails && (
        <Section style={EmailStyles.detailsContainer}>
          <Text style={EmailStyles.detailText}>
            {additionalDetails}
          </Text>
        </Section>
      )}

      <Text style={EmailStyles.footer}>
        This is an automated notification from our system.
      </Text>
    </BaseEmail>
  )
} 