'use client'

import { useState, useEffect } from 'react'
import { InvoiceStatusBadge } from '@/app/components/invoice/InvoiceStatusBadge'

interface InvoiceItem {
  id: string
  invoice_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product: {
    name: string
    description: string
  }
}

interface Invoice {
  id: string
  request_id: string
  user_id: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  amount: number
  due_date: string
  created_at: string
  updated_at: string
  items: InvoiceItem[]
  user: {
    name: string
    email: string
    shipping_address: {
      street_address: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
}

interface InvoiceWithItems {
  id: string
  request_id: string
  user_id: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  amount: number
  due_date: string
  created_at: string
  updated_at: string
  items: InvoiceItem[]
  user: {
    name: string
    email: string
    shipping_address: {
      street_address: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
  customer_name: string
  customer_email: string
}

interface Props {
  invoiceId: string
  onPreviewClick: () => void
}

export function InvoiceDetail({ invoiceId, onPreviewClick }: Props) {
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`)
        if (!response.ok) throw new Error('Failed to fetch invoice')
        const data = await response.json()
        setInvoice(data)
      } catch (error) {
        console.error('Error fetching invoice:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchInvoice()
  }, [invoiceId])

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/download`)
      if (!response.ok) throw new Error('Failed to download invoice')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      a.click()
    } catch (error) {
      console.error('Error downloading invoice:', error)
    }
  }

  const handleSendEmail = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to send invoice email')
    } catch (error) {
      console.error('Error sending invoice email:', error)
    }
  }

  if (loading || !invoice) return <div>Loading...</div>

  return (
    <div className="divide-y divide-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Invoice #{invoiceId}</h1>
          <InvoiceStatusBadge status={invoice?.status || 'draft'} />
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onPreviewClick}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Preview PDF
          </button>
          <button
            onClick={handleDownload}
            className="bg-white text-gray-700 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Download PDF
          </button>
          <button
            onClick={handleSendEmail}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Send Email
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Customer Information</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <p>{invoice.customer_name}</p>
              <p>{invoice.customer_email}</p>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Invoice Details</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <p>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
              <p>Created: {new Date(invoice.created_at).toLocaleDateString()}</p>
              <p>Last Updated: {new Date(invoice.updated_at).toLocaleDateString()}</p>
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoice.items.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-gray-500">{item.product.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${item.unit_price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${item.total_price}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                Total Amount:
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${invoice.amount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
} 