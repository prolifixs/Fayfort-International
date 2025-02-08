'use client'

import { ProfileNav } from '@/app/components/dashboard/profile/ProfileNav'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar">
        {children}
      </main>
    </div>
  )
} 