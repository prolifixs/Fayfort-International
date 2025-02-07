'use client'

import { useState, memo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
        roles: ['admin', 'customer', 'supplier']
      }
    ]
  }
]

const Navigation = memo(function Navigation({ userRole = 'customer' }: NavigationProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActiveLink = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Fayfort Enterprise
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
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="sr-only">Open menu</span>
          {isMobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white shadow-lg md:hidden">
            {navigation.map((section) =>
              section.items
                .filter(item => item.roles.includes(userRole))
                .map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className={`block px-4 py-2 ${
                      isActiveLink(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))
            )}
          </div>
        )}
      </div>
    </nav>
  )
})

export default Navigation