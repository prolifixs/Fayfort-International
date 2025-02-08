'use client'

import { useState, memo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { MobileMenu } from './MobileMenu/MobileMenu'
import type { NavSection } from '../types/navigation.types'

type UserRole = 'admin' | 'customer' | 'supplier'

interface NavigationProps {
  userRole?: UserRole
}

const navigation: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        roles: ['admin', 'customer', 'supplier']
      },
      {
        label: 'Catalog',
        path: '/catalog',
        roles: ['admin', 'customer', 'supplier']
      },
      {
        label: 'About',
        path: '/about',
        roles: ['admin', 'customer', 'supplier']
      }
    ]
  },
  {
    title: 'Management',
    items: [
      {
        label: 'Products',
        path: '/admin/catalog',
        roles: ['admin']
      },
      {
        label: 'Users',
        path: '/admin/users',
        roles: ['admin']
      },
      {
        label: 'Requests',
        path: '/request',
        roles: ['admin', 'supplier']
      }
    ]
  }
]

const Navigation = memo(function Navigation({ userRole = 'customer' }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Prefetch common routes
    router.prefetch('/dashboard')
    router.prefetch('/profile')
    router.prefetch('/catalog')
    // Add other frequently accessed routes
  }, [router])

  const isActiveLink = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const mobileMenuContent = (
    <div className="flex flex-col space-y-2">
      {navigation.map((section) =>
        section.items
          .filter(item => item.roles.includes(userRole))
          .map((item, index) => (
            <Link
              key={index}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg transition-colors ${
                isActiveLink(item.path)
                  ? 'bg-blue-500/10 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))
      )}
    </div>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Fayfort International
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-4">
          {navigation.map((section) =>
            section.items
              .filter(item => item.roles.includes(userRole))
              .map((item, index) => (
                <Link
                  key={index}
                  href={item.path}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isActiveLink(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {mobileMenuContent}
        </MobileMenu>
      </div>
    </nav>
  )
})

export default Navigation