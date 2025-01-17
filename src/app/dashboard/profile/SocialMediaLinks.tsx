import { useState } from 'react'
import { useUsers } from '@/app/hooks/useUsers'

interface SocialLink {
  id: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok'
  username: string
  url: string
  is_visible: boolean
}

const PLATFORMS = {
  facebook: {
    name: 'Facebook',
    icon: 'fb', // We'll add icons later
    baseUrl: 'https://facebook.com/'
  },
  instagram: {
    name: 'Instagram',
    icon: 'ig',
    baseUrl: 'https://instagram.com/'
  },
  twitter: {
    name: 'Twitter',
    icon: 'tw',
    baseUrl: 'https://twitter.com/'
  },
  tiktok: {
    name: 'TikTok',
    icon: 'tt',
    baseUrl: 'https://tiktok.com/@'
  }
}

export function SocialMediaLinks() {
  const { users } = useUsers()
  const user = users?.[0] // Get current user
  const [links, setLinks] = useState<SocialLink[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    platform: 'facebook' as SocialLink['platform'],
    username: '',
    url: '',
    is_visible: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/user/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to add social link')
      
      const newLink = await response.json()
      setLinks([...links, newLink])
      setIsAddingNew(false)
      setFormData({
        platform: 'facebook',
        username: '',
        url: '',
        is_visible: true
      })
    } catch (error) {
      console.error('Error adding social link:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/user/social-links/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete social link')
      
      setLinks(links.filter(link => link.id !== id))
    } catch (error) {
      console.error('Error deleting social link:', error)
    }
  }

  const handleVisibilityToggle = async (id: string, is_visible: boolean) => {
    try {
      const response = await fetch(`/api/user/social-links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible })
      })
      
      if (!response.ok) throw new Error('Failed to update social link')
      
      setLinks(links.map(link => 
        link.id === id ? { ...link, is_visible } : link
      ))
    } catch (error) {
      console.error('Error updating social link:', error)
    }
  }

  const handleUsernameChange = (username: string) => {
    const baseUrl = PLATFORMS[formData.platform].baseUrl
    setFormData({
      ...formData,
      username,
      url: `${baseUrl}${username}`
    })
  }

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Social Media Links</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Add New Link
        </button>
      </div>

      {/* Social Links List */}
      <div className="space-y-4">
        {links.map(link => (
          <div
            key={link.id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div className="flex items-center space-x-3">
              <span className="text-gray-500">{PLATFORMS[link.platform].name}</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
              >
                @{link.username}
              </a>
              {!link.is_visible && (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                  Hidden
                </span>
              )}
            </div>
            <div className="space-x-3">
              <button
                onClick={() => handleVisibilityToggle(link.id, !link.is_visible)}
                className="text-gray-600 hover:text-gray-800"
              >
                {link.is_visible ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => handleDelete(link.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Link Form */}
      {isAddingNew && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Platform
            </label>
            <select
              value={formData.platform}
              onChange={e => setFormData({
                ...formData,
                platform: e.target.value as SocialLink['platform']
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {Object.entries(PLATFORMS).map(([value, { name }]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                @
              </span>
              <input
                type="text"
                required
                value={formData.username}
                onChange={e => handleUsernameChange(e.target.value)}
                className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_visible"
              checked={formData.is_visible}
              onChange={e => setFormData({ ...formData, is_visible: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_visible" className="ml-2 text-sm text-gray-700">
              Make this link visible on my profile
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="bg-white text-gray-700 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Save Link
            </button>
          </div>
        </form>
      )}
    </div>
  )
} 