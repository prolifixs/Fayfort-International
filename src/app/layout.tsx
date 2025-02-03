import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from './components/ClientLayout'
import { ErrorBoundary } from '@/app/components/error/ErrorBoundary'
import { Suspense } from 'react'
import { InvoiceSkeleton } from '@/app/components/loading/InvoiceSkeleton'
import { Toaster } from "@/app/components/ui/toaster"

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
            <ClientLayout>
              {children}
            </ClientLayout>
          </Suspense>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
}