'use client'

import { Home, FileText, Bell, Settings, User } from 'lucide-react'

type DashboardView = 'dashboard' | 'requests' | 'notifications' | 'profile' | 'settings'

const navigation = [
  { name: 'Dashboard', view: 'dashboard', icon: Home },
  { name: 'Requests', view: 'requests', icon: FileText },
  { name: 'Notifications', view: 'notifications', icon: Bell },
  { name: 'Profile', view: 'profile', icon: User },
  { name: 'Settings', view: 'settings', icon: Settings },
] as const

interface SidebarProps {
  currentView: DashboardView
  onNavigate: (view: DashboardView) => void
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <img className="h-8 w-auto" src="/logo.png" alt="Your Logo" />
          </div>
          <nav className="mt-5 flex-1 flex flex-col divide-y divide-gray-200 overflow-y-auto">
            <div className="px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = currentView === item.view
                return (
                  <button
                    key={item.name}
                    onClick={() => onNavigate(item.view)}
                    className={`
                      w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 flex-shrink-0 h-6 w-6
                        ${isActive
                          ? 'text-gray-500'
                          : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    {item.name}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
} 