import { NotificationBadge } from '@/app/components/notification/NotificationBadge'
import { BellIcon } from '@heroicons/react/24/outline'
import { Sidebar } from '@/app/components/dashboard/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  )
} 