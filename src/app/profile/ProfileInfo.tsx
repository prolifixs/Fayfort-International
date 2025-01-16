'use client'

import { useState } from 'react'
import { useToast } from '@/app/hooks/useToast'
import Toast from '@/app/components/Toast'

interface ProfileInfoProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
  }
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  })
  const { toast, isVisible, toastProps, onClose } = useToast()

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
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          {isEditing ? 'Cancel' : 'Edit'}
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

      {isVisible && <Toast {...toastProps} onClose={onClose} />}
    </div>
  )
} 