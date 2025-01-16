'use client'

import { useState, useEffect } from 'react'
import { AddressForm } from './AddressForm'
import { SocialMediaLinks } from './SocialMediaLinks'
import { Preferences } from './Preferences'
import { ProfileInfo } from '@/app/profile/ProfileInfo'
import { useUsers } from '@/app/hooks/useUsers'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/Tabs'

export default function ProfilePage() {
  const { users, loading } = useUsers()
  const [activeTab, setActiveTab] = useState('profile')

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  }

  const user = users?.[0]

  if (!user) return <div>Please sign in to view your profile.</div>

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile">
            <ProfileInfo user={user} />
          </TabsContent>
          
          <TabsContent value="addresses">
            <AddressForm />
          </TabsContent>
          
          <TabsContent value="social">
            <SocialMediaLinks />
          </TabsContent>
          
          <TabsContent value="preferences">
            <Preferences />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 