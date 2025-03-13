'use client'

import {
  Text,
  Hr,
  Container,
  Section as EmailSection,
  Column,
  Row,
} from '@react-email/components';
import { BaseEmail } from './BaseEmail';
import { Button, DetailRow, Section, Alert } from '../components';
import { EmailStyles } from './styles/EmailStyles';
import { formatCurrency, formatDate } from '../../lib/utils';

// Define strict types for invoice items and status
type InvoiceItem = {
  description: string;
  quantity: number;
  price: number;
  total?: number; // Optional as it can be calculated
};

type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

interface InvoiceEmailProps {
  // Customer details
  customerName: string;
  customerEmail: string;
  
  // Invoice details
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  createdAt: string;
  items: InvoiceItem[];
  
  // Payment details
  paymentLink: string;
  status: InvoiceStatus;
  
  // Optional branding
  companyName?: string;
  companyLogo?: string;
}

const ItemRow = ({ item }: { item: InvoiceItem }) => {
  const total = item.total || item.quantity * item.price;
  
  return (
    <Row style={{ marginBottom: '8px' }}>
      <Column style={{ width: '50%' }}>
        <Text style={EmailStyles.itemText}>
          {item.description}
        </Text>
      </Column>
      <Column style={{ width: '20%', textAlign: 'right' }}>
        <Text style={EmailStyles.itemText}>
          {item.quantity}x
        </Text>
      </Column>
      <Column style={{ width: '30%', textAlign: 'right' }}>
        <Text style={EmailStyles.itemText}>
          {formatCurrency(total)}
        </Text>
      </Column>
    </Row>
  );
};

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const statusStyles: Record<InvoiceStatus, { color: string; background: string }> = {
    draft: { color: '#6B7280', background: '#F3F4F6' },
    pending: { color: '#D97706', background: '#FEF3C7' },
    paid: { color: '#059669', background: '#D1FAE5' },
    overdue: { color: '#DC2626', background: '#FEE2E2' },
    cancelled: { color: '#4B5563', background: '#F3F4F6' }
  };

  const style = statusStyles[status];
  
  return (
    <Text style={{
      ...EmailStyles.text,
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '4px',
      ...style
    }}>
      {status.toUpperCase()}
    </Text>
  );
};

export function InvoiceEmail({
  customerName,
  customerEmail,
  invoiceNumber,
  amount,
  dueDate,
  createdAt,
  items,
  paymentLink,
  status,
  companyName = 'Fayfort Enterprise',
  companyLogo
}: InvoiceEmailProps) {
  const isActionable = status === 'pending' || status === 'overdue';
  const totalAmount = items.reduce((sum, item) => sum + (item.total || item.quantity * item.price), 0);

  return (
    <BaseEmail
      previewText={`Invoice ${invoiceNumber} for ${formatCurrency(amount)}`}
      title={`Invoice ${invoiceNumber}`}
    >
      <Container style={{ padding: '20px' }}>
        {/* Header Section */}
        <Section style={{ marginBottom: '24px' }}>
          <Row>
            <Column>
              <Text style={EmailStyles.heading}>Invoice</Text>
              <StatusBadge status={status} />
            </Column>
            {companyLogo && (
              <Column align="right">
                <img src={companyLogo} alt={companyName} width="120" />
              </Column>
            )}
          </Row>
        </Section>

        {/* Alert Messages */}
        {status === 'overdue' && (
          <Alert type="warning">
            This invoice is overdue. Please make your payment as soon as possible.
          </Alert>
        )}

        {status === 'paid' && (
          <Alert type="success">
            Thank you! This invoice has been paid in full.
          </Alert>
        )}

        {/* Invoice Details */}
        <Section>
          <DetailRow label="Invoice Number" value={invoiceNumber} />
          <DetailRow label="Issue Date" value={formatDate(createdAt)} />
          <DetailRow label="Due Date" value={formatDate(dueDate)} />
          <DetailRow label="Status" value={<StatusBadge status={status} />} />
        </Section>

        <Hr style={EmailStyles.divider} />

        {/* Customer Details */}
        <Section>
          <Text style={EmailStyles.sectionTitle}>Bill To:</Text>
          <Text style={EmailStyles.text}>
            {customerName}<br />
            {customerEmail}
          </Text>
        </Section>

        {/* Invoice Items */}
        <Section style={{ backgroundColor: '#f9fafb', padding: '16px', marginTop: '24px' }}>
          <Text style={EmailStyles.sectionTitle}>Invoice Items</Text>
          
          {items.map((item, index) => (
            <ItemRow key={index} item={item} />
          ))}

          <Hr style={EmailStyles.divider} />
          
          <Row style={{ marginTop: '16px' }}>
            <Column style={{ width: '70%' }}>
              <Text style={EmailStyles.totalText}>Total Amount</Text>
            </Column>
            <Column style={{ width: '30%', textAlign: 'right' }}>
              <Text style={EmailStyles.totalAmount}>
                {formatCurrency(totalAmount)}
              </Text>
            </Column>
          </Row>
        </Section>

        {/* Payment Button */}
        {isActionable && (
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button href={paymentLink} variant="primary">
              Pay Invoice Now
            </Button>
          </Section>
        )}

        {/* Footer Note */}
        <Section style={{ marginTop: '32px' }}>
          <Text style={EmailStyles.note}>
            If you have any questions about this invoice, please contact our support team.
          </Text>
        </Section>
      </Container>
    </BaseEmail>
  );
} 