'use client'

import { useState, useEffect } from 'react'
import { InvoiceStatusBadge } from '@/app/components/invoice/InvoiceStatusBadge'
import { generateInvoicePDF } from '@/app/components/lib/pdf/generateInvoicePDF'
import { Loader2, Eye, Download, Mail } from 'lucide-react'
import Toast from '@/app/components/Toast'
import { useRouter } from 'next/navigation'

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
  invoice_items: InvoiceItem[]
  pdf_url?: string
  request?: {
    id: string
    customer: {
      name: string
      email: string
      shipping_address?: {
        street_address: string
        city: string
        state: string
        postal_code: string
        country: string
        is_default: boolean
      }
    }
  }
}

export function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`)
        if (!response.ok) throw new Error('Failed to fetch invoice')
        const data = await response.json()
        console.log('📥 Fetched Invoice Data:', data)
        setInvoice(data)
      } catch (error) {
        console.error('Error:', error)
        setToastMessage({ message: 'Failed to fetch invoice details', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    
    fetchInvoice()
  }, [invoiceId])

  const handlePreviewClick = () => {
    if (invoice) {
      console.log('Navigating to preview page:', invoice.id)
      router.push(`/dashboard/invoices/${invoiceId}/preview`)
    }
  }

  const handleDownload = async () => {
    if (!invoice) return

    try {
      setIsGenerating(true)
      const invoiceData = {
        ...invoice,
        request: {
          id: invoice.request_id,
          customer: {
            name: invoice?.request?.customer?.name || 'N/A',
            email: invoice?.request?.customer?.email || 'N/A',
            shipping_address: invoice?.request?.customer?.shipping_address || undefined
          }
        },
        invoices: (invoice.invoice_items || []).map(item => ({
          ...item,
          product: { 
            ...item.product,
            category: 'default'
          }
        }))
      }
      const pdfBlob = await generateInvoicePDF(invoiceData)
      const url = window.URL.createObjectURL(new Blob([pdfBlob]))
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading invoice:', error)
      setToastMessage({ message: 'Failed to download invoice', type: 'error' })
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <>
      {toastMessage && (
        <Toast 
          message={toastMessage.message} 
          type={toastMessage.type} 
          onClose={() => setToastMessage(null)} 
        />
      )}
      <div className="divide-y divide-gray-200">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Invoice #{invoiceId}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePreviewClick}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview PDF
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Customer Information</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <p>{invoice?.request?.customer?.name || 'N/A'}</p>
                <p>{invoice?.request?.customer?.email || 'N/A'}</p>
                {invoice?.request?.customer?.shipping_address && (
                  <>
                    <p>{invoice.request.customer.shipping_address.street_address}</p>
                    <p>
                      {invoice.request.customer.shipping_address.city}, {invoice.request.customer.shipping_address.state} {invoice.request.customer.shipping_address.postal_code}
                    </p>
                    <p>{invoice.request.customer.shipping_address.country}</p>
                  </>
                )}
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
              {invoice.invoice_items.map(item => (
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
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.total_price.toFixed(2)}
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
                  ${invoice.amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
} 