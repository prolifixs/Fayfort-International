'use client'

import { ProfileInfo } from '@/app/components/profile/ProfileInfo'
import { useUsers } from '@/app/hooks/useUsers'

export default function ProfilePage() {
  const { users, loading } = useUsers()
  
  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  const user = users?.[0]
  if (!user) return <div>Please sign in to view your profile.</div>

  return <ProfileInfo user={user} />
} 