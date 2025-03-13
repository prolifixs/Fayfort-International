'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/Tabs"
import { InvoiceEmail } from './templates/InvoiceEmail'
import { StatusChangeEmail } from './templates/StatusChangeEmail'
import { NotificationEmail } from './templates/NotificationEmail'
import { WelcomeEmail } from './templates/WelcomeEmail'
import { VerificationEmail } from './templates/VerificationEmail'
import { PasswordResetEmail } from './templates/PasswordResetEmail'
import { Invoice } from '@/app/components/types/invoice'

interface EmailPreviewSystemProps {
  open: boolean
  onClose: () => void
  data: {
    invoice?: Invoice
    status?: {
      previous: string
      new: string
    }
    notification?: {
      title: string
      message: string
    }
    user?: {
      name: string
      email: string
    }
  }
}

export function EmailPreviewSystem({ open, onClose, data }: EmailPreviewSystemProps) {
  const [activeTemplate, setActiveTemplate] = useState('invoice')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Email Template Preview</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="notification">Notification</TabsTrigger>
            <TabsTrigger value="welcome">Welcome</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="reset">Password Reset</TabsTrigger>
          </TabsList>

          <div className="border rounded-md p-4 bg-white mt-4">
            <TabsContent value="invoice">
              {data.invoice && (
                <InvoiceEmail
                  customerName={data.invoice.request?.customer?.name || "Customer"}
                  invoiceNumber={data.invoice.id}
                  amount={data.invoice.amount}
                  dueDate={data.invoice.due_date}
                  items={data.invoice.invoice_items.map(item => ({
                    description: item.product.name,
                    quantity: item.quantity,
                    price: item.unit_price
                  }))}
                  paymentLink={`${process.env.NEXT_PUBLIC_APP_URL}/invoice/${data.invoice.id}`}
                  status={data.invoice.status === 'paid' ? 'paid' : 
                         data.invoice.status === 'sent' ? 'pending' : 
                         data.invoice.status === 'failed' ? 'overdue' : 'pending'}
                />
              )}
            </TabsContent>

            <TabsContent value="status">
              {data.status && (
                <StatusChangeEmail
                  customerName={data.user?.name || "Customer"}
                  requestId="123"
                  previousStatus={data.status.previous as any}
                  newStatus={data.status.new as any}
                  actionLink="/dashboard"
                />
              )}
            </TabsContent>

            <TabsContent value="notification">
              {data.notification && (
                <NotificationEmail
                  userName={data.user?.name || "Customer"}
                  subject={data.notification.title}
                  message={data.notification.message}
                  type="info"
                />
              )}
            </TabsContent>

            <TabsContent value="welcome">
              <WelcomeEmail
                userName={data.user?.name || "Customer"}
                verificationLink="/verify"
              />
            </TabsContent>

            <TabsContent value="verification">
              <VerificationEmail
                userName={data.user?.name || "Customer"}
                verificationCode="123456"
                verificationLink="/verify"
              />
            </TabsContent>

            <TabsContent value="reset">
              <PasswordResetEmail
                userName={data.user?.name || "Customer"}
                resetLink="/reset"
              />
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 