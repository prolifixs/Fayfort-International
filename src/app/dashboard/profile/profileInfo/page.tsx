'use client'

import { ProfileInfo } from '@/app/components/dashboard/profile/ProfileInfo'
import { useUsers } from '@/app/hooks/useUsers'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/app/components/types/database.types'
import { useEffect, useState } from 'react'

type UserWithAddresses = Database['public']['Tables']['users']['Row'] & {
  addresses: Database['public']['Tables']['shipping_address']['Row'][]
}

export default function ProfileInfoPage() {
  const { users, loading } = useUsers()
  const [userWithAddresses, setUserWithAddresses] = useState<UserWithAddresses | null>(null)
  const supabase = createClientComponentClient<Database>()
  
  useEffect(() => {
    async function fetchUserWithAddresses() {
      if (!users?.[0]?.id) {
        console.log('No user ID available')
        return
      }
      
      console.log('Fetching addresses for user:', users[0].id)
      const { data, error } = await supabase
        .from('shipping_address')
        .select('*')
        .eq('user_id', users[0].id)
      
      if (error) {
        console.error('Error fetching addresses:', error)
        return
      }
      
      console.log('Fetched addresses:', data)
      
      if (!error && users?.[0]) {
        setUserWithAddresses({
          ...users[0],
          addresses: data || []
        })
      }
    }
    
    fetchUserWithAddresses()
  }, [users])

  if (loading || !userWithAddresses) {
    return <div className="animate-pulse">Loading...</div>
  }

  return <ProfileInfo user={userWithAddresses} />
} 