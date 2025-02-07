'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceData } from '@/app/components/types/invoice'

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  status: {
    fontSize: 12,
    padding: 6,
    borderRadius: 4
  },
  section: {
    marginBottom: 20
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginTop: 20,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf'
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0'
  },
  tableCell: {
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf'
  },
  total: {
    marginTop: 20,
    textAlign: 'right'
  }
})

interface Props {
  invoice: InvoiceData
}

export function InvoicePDF({ invoice }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE #{invoice.id}</Text>
          <Text style={styles.status}>{invoice.status.toUpperCase()}</Text>
        </View>

        <View style={styles.section}>
          <Text>Bill To:</Text>
          <Text>{invoice.request.customer.name}</Text>
          <Text>{invoice.request.customer.email}</Text>
          {invoice.request.customer.shipping_address && (
            <>
              <Text>{invoice.request.customer.shipping_address.street_address}</Text>
              <Text>
                {invoice.request.customer.shipping_address.city}, {invoice.request.customer.shipping_address.state} {invoice.request.customer.shipping_address.postal_code}
              </Text>
              <Text>{invoice.request.customer.shipping_address.country}</Text>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text>Date: {new Date(invoice.created_at).toLocaleDateString()}</Text>
          <Text>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, { flex: 2 }]}>
              <Text>Item</Text>
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <Text>Quantity</Text>
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <Text>Unit Price</Text>
            </View>
            <View style={[styles.tableCell, { flex: 1 }]}>
              <Text>Total</Text>
            </View>
          </View>

          {invoice.invoices.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text>{item.product.name}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>${item.unit_price.toFixed(2)}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text>${item.total_price.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.total}>
          <Text>Total Amount: ${invoice.amount.toFixed(2)}</Text>
        </View>
      </Page>
    </Document>
  )
}