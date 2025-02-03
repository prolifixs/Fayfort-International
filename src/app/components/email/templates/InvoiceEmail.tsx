'use client'

import { Text, Button, Section } from '@react-email/components'
import { Invoice } from '@/app/components/types/invoice'
import { BaseEmail } from './BaseEmail'
import { EmailStyles } from './styles/EmailStyles'

interface InvoiceEmailProps {
  invoice: Invoice
  previewMode?: boolean
}

export function InvoiceEmail({ invoice, previewMode = false }: InvoiceEmailProps) {
  const previewText = `Invoice #${invoice.id} is ready for your review`

  return (
    <BaseEmail previewText={previewText} title="Invoice Ready">
      <Text style={EmailStyles.text}>
        Your invoice #{invoice.id} has been generated and is ready for review.
      </Text>
      
      <Section style={EmailStyles.detailsContainer}>
        <Text style={EmailStyles.detailText}>
          Amount Due: ${invoice.amount.toFixed(2)}
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