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

interface StatusChangeEmailProps {
  invoice: Invoice
  previousStatus: Invoice['status']
  previewMode?: boolean
}

export function StatusChangeEmail({ invoice, previousStatus, previewMode = false }: StatusChangeEmailProps) {
  const statusMessages = {
    draft: 'has been saved as a draft',
    sent: 'has been sent for payment',
    paid: 'has been marked as paid',
    cancelled: 'has been cancelled'
  }

  const previewText = `Invoice #${invoice.id} status changed to ${invoice.status}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Invoice Status Update</Heading>
          <Text style={text}>
            Invoice #{invoice.id} {statusMessages[invoice.status]}.
          </Text>
          
          <Section style={detailsContainer}>
            <Text style={detailText}>
              Previous Status: {previousStatus}
              <br />
              New Status: {invoice.status}
              <br />
              Amount: ${invoice.amount.toFixed(2)}
              <br />
              Due Date: {new Date(invoice.due_date).toLocaleDateString()}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button
              style={button}
              href={previewMode ? '#' : `/invoices/${invoice.id}`}
            >
              View Invoice
            </Button>
          </Section>
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

const detailsContainer = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '24px 0',
  padding: '16px',
}

const detailText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
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