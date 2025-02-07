'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/components/lib/utils'

const navItems = [
  { label: 'Profile Info', href: '/dashboard/profile' },
  { label: 'Addresses', href: '/dashboard/profile/addresses' },
  { label: 'Social Media', href: '/dashboard/profile/social' },
  { label: 'Preferences', href: '/dashboard/profile/preferences' }
]

export function ProfileNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex items-center px-1 pt-1 pb-2 text-sm font-medium border-b-2',
                pathname === item.href
                  ? 'border-indigo-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
} 