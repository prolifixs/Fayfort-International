'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/components/lib/utils'
import { User, MapPin, Share2, Settings } from 'lucide-react'

const navItems = [
  { label: 'Profile Info', href: '/dashboard/profile', icon: User },
  { label: 'Addresses', href: '/dashboard/profile/addresses', icon: MapPin },
  { label: 'Social Media', href: '/dashboard/profile/social', icon: Share2 },
  { label: 'Preferences', href: '/dashboard/profile/preferences', icon: Settings }
]

export function ProfileNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Icon + Label Navigation */}
        <div className="md:hidden">
          <div className="flex justify-around items-center py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg transition-colors',
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center px-1 pt-1 pb-2 text-sm font-medium border-b-2 gap-2',
                  pathname === item.href
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )}
          )}
        </div>
      </div>
    </nav>
  )
} 