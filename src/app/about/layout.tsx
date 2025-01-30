'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/about', label: 'About Us' },
  { href: '/about/careers', label: 'Careers' },
  { href: '/about/faq', label: 'FAQ' },
  { href: '/about/privacy', label: 'Privacy' },
  { href: '/about/contact', label: 'Contact' },
]

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 h-16">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                  ${usePathname() === item.href
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {children}
    </>
  )
} 