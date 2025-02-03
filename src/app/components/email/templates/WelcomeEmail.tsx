'use client'

import { Text, Button, Section, Hr } from '@react-email/components'
import { BaseEmail } from './BaseEmail'
import { EmailStyles } from './styles/EmailStyles'

interface WelcomeEmailProps {
  name: string
  previewMode?: boolean
}

export function WelcomeEmail({ name, previewMode = false }: WelcomeEmailProps) {
  const previewText = `Welcome to Our Platform, ${name}!`

  return (
    <BaseEmail previewText={previewText} title="Welcome to Our Platform!">
      <Text style={EmailStyles.text}>
        Hi {name},
      </Text>
      
      <Text style={EmailStyles.text}>
        We're excited to have you on board! Here's what you can do to get started:
      </Text>

      <Section style={EmailStyles.detailsContainer}>
        <Text style={EmailStyles.detailText}>
          • Complete your profile information
          <br />
          • Browse available products
          <br />
          • Set up your payment preferences
          <br />
          • Explore our documentation
        </Text>
      </Section>

      <Hr style={{ ...EmailStyles.text, borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

      <Section style={EmailStyles.buttonContainer}>
        <Button
          style={EmailStyles.button}
          href={previewMode ? '#' : '/dashboard'}
        >
          Get Started
        </Button>
      </Section>

      <Text style={EmailStyles.footer}>
        If you have any questions, feel free to reach out to our support team.
      </Text>
    </BaseEmail>
  )
} 