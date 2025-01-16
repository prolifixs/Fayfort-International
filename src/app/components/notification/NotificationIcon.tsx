'use client'

import { Bell } from 'lucide-react'

interface NotificationIconProps {
  count: number;
}

export function NotificationIcon({ count }: NotificationIconProps) {
  return (
    <div className="relative">
      <Bell className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  )
}