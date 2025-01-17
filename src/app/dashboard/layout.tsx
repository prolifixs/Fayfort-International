'use client'

import { useState } from 'react'
import { Sidebar } from '@/app/components/dashboard/Sidebar'
import DashboardPage from './page'
import RequestsPage from './requests/page'
import NotificationsPage from './notifications/page'
import { ProfilePage } from './profile/page'
import SettingsPage from './settings/page'
import { usePathname, useRouter } from 'next/navigation'
import { InvoiceDetail } from '@/app/components/invoice/InvoiceDetail'
import { Button } from '@/app/components/ui/button'
import { ChevronLeft } from 'lucide-react'

type DashboardView = 'dashboard' | 'requests' | 'notifications' | 'profile' | 'settings'

export function DashboardLayout() {
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard')
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're on an invoice route
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

  // Regular dashboard views
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage />
      case 'requests':
        return <RequestsPage />
      case 'notifications':
        return <NotificationsPage />
      case 'profile':
        return <ProfilePage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar onNavigate={setCurrentView} currentView={currentView} />
      <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout