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
} from '@react-email/components'
import { Invoice } from '@/app/components/types/invoice'

interface InvoiceEmailProps {
  invoice: Invoice
  previewMode?: boolean
}

export function InvoiceEmail({ invoice, previewMode = false }: InvoiceEmailProps) {
  const previewText = `Invoice #${invoice.id} is ready for your review`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Invoice Ready</Heading>
          <Text style={text}>
            Your invoice #{invoice.id} has been generated and is ready for review.
          </Text>
          <Section style={buttonContainer}>
            <Button
              style={button}
              href={previewMode ? '#' : `/invoices/${invoice.id}`}
            >
              View Invoice
            </Button>
          </Section>
          <Text style={footer}>
            Amount Due: ${invoice.amount.toFixed(2)}
            <br />
            Due Date: {new Date(invoice.due_date).toLocaleDateString()}
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

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
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