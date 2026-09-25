import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { StripeProvider } from '@/app/providers/StripeProvider'
import { ErrorBoundary } from '@/app/components/common/error/ErrorBoundary'
import { Toaster } from '@/app/components/ui/toaster'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fayfort.com'),
  title: 'FAYFORT International Trading',
  description: 'Sourcing, inspection, consolidation and shipping from China, run by someone who lives here. Publisher of LANDED, the Guangzhou sourcing directory.',
  openGraph: { siteName: 'FAYFORT International Trading', type: 'website', locale: 'en_GB' },
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
