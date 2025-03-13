'use client'

import { Text } from '@react-email/components'
import { BaseEmail } from './BaseEmail'
import { Button, Alert, Section } from '../components'
import { EmailStyles } from './styles/EmailStyles'
import { RequestStatus } from '../../types/invoice'

interface StatusChangeEmailProps {
  customerName: string
  requestId: string
  previousStatus: RequestStatus
  newStatus: RequestStatus
  message?: string
  actionLink?: string
}

export function StatusChangeEmail({
  customerName,
  requestId,
  previousStatus,
  newStatus,
  message,
  actionLink,
}: StatusChangeEmailProps) {
  const getStatusAlert = () => {
    switch (newStatus) {
      case 'approved':
        return <Alert type="success">Your request has been approved!</Alert>
      case 'rejected':
        return <Alert type="error">Your request has been declined.</Alert>
      default:
        return <Alert type="warning">Your request status has been updated.</Alert>
    }
  }

  return (
    <BaseEmail
      previewText={`Request ${requestId} status updated to ${newStatus}`}
      title="Request Status Update"
    >
      <Text style={EmailStyles.text}>
        Dear {customerName},
      </Text>

      <Section>
        {getStatusAlert()}
        
        <Text style={EmailStyles.text}>
          Your request ({requestId}) status has been changed from{' '}
          <strong>{previousStatus}</strong> to <strong>{newStatus}</strong>.
        </Text>

        {message && (
          <Text style={EmailStyles.text}>
            {message}
          </Text>
        )}
      </Section>

      {actionLink && (
        <Button href={actionLink} variant="primary">
          View Request Details
        </Button>
      )}

      <Text style={EmailStyles.text}>
        If you have any questions, please contact our support team.
      </Text>
    </BaseEmail>
  )
} 