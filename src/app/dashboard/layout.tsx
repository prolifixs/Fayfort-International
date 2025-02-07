'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/app/components/dashboard/Sidebar'
import { usePathname, useRouter } from 'next/navigation'
import { InvoiceDetail } from '@/app/components/common/invoice/InvoiceDetail'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft } from 'lucide-react'

type DashboardView = 'dashboard' | 'requests' | 'notifications' | 'profile' | 'settings'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard')
  const router = useRouter()
  const pathname = usePathname()

  // Update currentView based on pathname
  useEffect(() => {
    const path = pathname.split('/')[2] // Get second segment after /dashboard/
    if (path && ['requests', 'notifications', 'profile', 'settings'].includes(path)) {
      setCurrentView(path as DashboardView)
    } else {
      setCurrentView('dashboard')
    }
  }, [pathname])

  // Handle invoice routes
  const invoiceMatch = pathname.match(/\/dashboard\/invoices\/(.+)/)
  if (invoiceMatch) {
    return (
      <div className="h-screen flex overflow-hidden">
        <Sidebar onNavigate={setCurrentView} currentView={currentView} />
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <InvoiceDetail invoiceId={invoiceMatch[1]} />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar onNavigate={(view) => {
        setCurrentView(view)
        const path = view === 'dashboard' ? '/dashboard' : `/dashboard/${view}`
        router.push(path)
      }} currentView={currentView} />
      <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
