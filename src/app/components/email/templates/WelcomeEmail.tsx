'use client'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Section,
  Hr,
} from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  previewMode?: boolean
}

export function WelcomeEmail({ name, previewMode = false }: WelcomeEmailProps) {
  const previewText = `Welcome to Our Platform, ${name}!`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Our Platform!</Heading>
          <Text style={text}>
            Hi {name},
          </Text>
          <Text style={text}>
            We're excited to have you on board. Here's what you can do to get started:
          </Text>
          
          <Section style={listContainer}>
            <Text style={listItem}>✓ Complete your profile</Text>
            <Text style={listItem}>✓ Set up your preferences</Text>
            <Text style={listItem}>✓ Explore the dashboard</Text>
          </Section>

          <Hr style={divider} />
          
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={previewMode ? '#' : '/dashboard'}
            >
              Go to Dashboard
            </Button>
          </Section>

          <Text style={footer}>
            If you have any questions, feel free to reply to this email.
            Our support team is always happy to help!
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
}

const listContainer = {
  margin: '24px 0',
}

const listItem = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '8px',
}

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px',
  textAlign: 'center' as const,
} 