import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { StripeProvider } from '@/app/providers/StripeProvider'
import { ErrorBoundary } from '@/app/components/common/error/ErrorBoundary'
import { Toaster } from '@/app/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Fayfort International',
  description: 'Fayfort International Trading — sourcing, catalog, and trade services.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the site pages' reveal boot script adds a class to <html> before hydration.
    <html lang="en" suppressHydrationWarning>
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
