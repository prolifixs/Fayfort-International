import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { StripeProvider } from '@/app/providers/StripeProvider'
import { ErrorBoundary } from '@/app/components/common/error/ErrorBoundary'
import { Toaster } from '@/app/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Landed — Sourcing at the Canton Fair and Beyond | FayFay',
  description: 'The practical guide to buying from Chinese factories, verifying suppliers, shipping goods, and calculating your true landed cost.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Suspense fallback={<div className="route-loading" aria-label="Loading" />}>
            <StripeProvider>
              <LoadingProvider>
                <AuthProvider>{children}</AuthProvider>
              </LoadingProvider>
            </StripeProvider>
          </Suspense>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
}
