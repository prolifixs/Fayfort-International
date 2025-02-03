'use client'

import { Text, Button, Section } from '@react-email/components'
import { Invoice } from '@/app/components/types/invoice'
import { BaseEmail } from './BaseEmail'
import { EmailStyles } from './styles/EmailStyles'

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
    <BaseEmail previewText={previewText} title="Invoice Status Update">
      <Text style={EmailStyles.text}>
        Invoice #{invoice.id} {statusMessages[invoice.status]}.
      </Text>
      
      <Section style={EmailStyles.detailsContainer}>
        <Text style={EmailStyles.detailText}>
          Previous Status: {previousStatus}
          <br />
          New Status: {invoice.status}
          <br />
          Amount: ${invoice.amount.toFixed(2)}
          <br />
          Due Date: {new Date(invoice.due_date).toLocaleDateString()}
        </Text>
      </Section>

      <Section style={EmailStyles.buttonContainer}>
        <Button
          style={EmailStyles.button}
          href={previewMode ? '#' : `/invoices/${invoice.id}`}
        >
          View Invoice
        </Button>
      </Section>
    </BaseEmail>
  )
} 