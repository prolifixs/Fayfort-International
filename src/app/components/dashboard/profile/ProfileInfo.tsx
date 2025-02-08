'use client'

import { useState } from 'react'
import { useToast } from '@/app/hooks/useToast'
import Toast from '@/app/components/ui/status/Toast'
import { ProfileAvatar } from './ProfileAvatar'
import { SocialMediaLinks } from './SocialMediaLinks'
import { AddressCard } from './AddressCard'
import { motion } from 'framer-motion'
import { MapPin, Share2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ProfileInfoProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
    avatar_url?: string
    addresses?: Array<{
      id: string
      street_address: string
      city: string
      state: string
      postal_code: string
      country: string
      is_default: boolean
    }>
  }
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url
  })
  const { toast, isVisible, toastProps, onClose } = useToast()

  const handleAvatarUpdate = (url: string) => {
    setFormData(prev => ({ ...prev, avatar_url: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update profile')

      setIsEditing(false)
      toast({ message: 'Profile updated successfully', type: 'success' })
    } catch (error) {
      toast({ message: 'Error updating profile', type: 'error' })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Profile Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow sm:rounded-lg p-8"
        >
          <ProfileAvatar 
            imageUrl={formData.avatar_url}
            userName={user.name}
            onImageUpdate={handleAvatarUpdate}
          />

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
            <button
              onClick={async () => {
                const supabase = createClientComponentClient()
                await supabase.auth.signOut()
                window.location.href = '/'
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form fields */}
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-sm text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <p className="mt-1 text-sm text-gray-900">{user.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1 text-sm text-gray-900">{user.status}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Address Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white shadow sm:rounded-lg p-8"
        >
          <div className="flex items-center mb-6">
            <MapPin className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">Addresses</h2>
          </div>
          <div className="space-y-4">
            {user.addresses?.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onSetDefault={(id) => {/* Handle set default */}}
                onDelete={(id) => {/* Handle delete */}}
              />
            ))}
          </div>
        </motion.div>

        {/* Social Media Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white shadow sm:rounded-lg p-8"
        >
          <div className="flex items-center mb-6">
            <Share2 className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">Social Media</h2>
          </div>
          <SocialMediaLinks />
        </motion.div>
      </div>

      {isVisible && toastProps.message && (
        <Toast 
          message={toastProps.message} 
          type={toastProps.type || 'success'} 
          onClose={onClose} 
        />
      )}
    </div>
  )
} 