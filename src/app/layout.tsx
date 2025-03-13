import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from './components/common/ClientLayout'
import { ErrorBoundary } from '@/app/components/common/error/ErrorBoundary'
import { Suspense } from 'react'
import { InvoiceSkeleton } from '@/app/components/common/loading/InvoiceSkeleton'
import { Toaster } from "@/app/components/ui/toaster"
import { StripeProvider } from '@/app/providers/StripeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fayfort Enterprise - Catalog Portfolio',
  description: 'Your trusted business partner for product sourcing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Suspense fallback={<InvoiceSkeleton />}>
            <StripeProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </StripeProvider>
          </Suspense>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
}