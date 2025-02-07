'use client'

import { useState, useEffect } from 'react'
import { useUsers } from '@/app/hooks/useUsers'
import { useToast } from '@/app/hooks/useToast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'

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
  const user = users?.[0]
  const [links, setLinks] = useState<SocialLink[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    platform: 'facebook' as SocialLink['platform'],
    username: '',
    url: '',
    is_visible: true
  })
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch social links on component mount
  useEffect(() => {
    if (!user?.id) return
    
    fetchSocialLinks()
    
    // Set up real-time subscription
    const supabase = createClientComponentClient()
    const channel = supabase
      .channel('social_media_links')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_media_links',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLinks(prev => [...prev, payload.new as SocialLink])
          } else if (payload.eventType === 'UPDATE') {
            setLinks(prev =>
              prev.map(link =>
                link.id === payload.new.id
                  ? { ...link, ...payload.new }
                  : link
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setLinks(prev => 
              prev.filter(link => link.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const fetchSocialLinks = async () => {
    if (!user?.id) return

    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      setLinks(data || [])
    } catch (err) {
      const error = err as Error
      toast({ 
        message: error.message || 'Error fetching social links', 
        type: 'error' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    
    setIsSubmitting(true)
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase
        .from('social_media_links')
        .insert({
          ...formData,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      setLinks([...links, data])
      setIsAddingNew(false)
      setFormData({
        platform: 'facebook',
        username: '',
        url: '',
        is_visible: true
      })
      
      toast({ 
        message: 'Social link added successfully', 
        type: 'success' 
      })
    } catch (err) {
      const error = err as Error
      toast({ 
        message: error.message || 'Error adding social link', 
        type: 'error' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeletingId(id)
    const previousLinks = [...links]
    setLinks(links.filter(link => link.id !== id))
    
    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase
        .from('social_media_links')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      
      toast({ 
        message: 'Social link deleted successfully', 
        type: 'success' 
      })
    } catch (err) {
      setLinks(previousLinks)
      const error = err as Error
      toast({ 
        message: error.message || 'Error deleting social link', 
        type: 'error' 
      })
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleVisibilityToggle = async (id: string, is_visible: boolean) => {
    setIsTogglingId(id)
    const previousLinks = [...links]
    setLinks(links.map(link => 
      link.id === id ? { ...link, is_visible } : link
    ))
    
    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase
        .from('social_media_links')
        .update({ is_visible })
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error
      
      toast({ 
        message: 'Visibility updated successfully', 
        type: 'success' 
      })
    } catch (err) {
      setLinks(previousLinks)
      const error = err as Error
      toast({ 
        message: error.message || 'Error updating visibility', 
        type: 'error' 
      })
    } finally {
      setIsTogglingId(null)
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

      {/* Loading State */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {links.map(link => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center space-x-4">
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
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVisibilityToggle(link.id, !link.is_visible)}
                    disabled={isTogglingId === link.id}
                    className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                  >
                    {isTogglingId === link.id ? (
                      <LoadingSpinner className="w-4 h-4" />
                    ) : (
                      link.is_visible ? 'Hide' : 'Show'
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    disabled={isDeletingId === link.id}
                    className="px-3 py-1 text-sm text-red-600 rounded-md border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors duration-200"
                  >
                    {isDeletingId === link.id ? (
                      <LoadingSpinner className="w-4 h-4" />
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add New Link Form */}
      {isAddingNew && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 border rounded-lg p-6 bg-gray-50"
        >
          <div className="grid grid-cols-2 gap-4">
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
              <div className="mt-1 relative rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  @
                </span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="username"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoadingSpinner className="w-4 h-4" />
              ) : (
                'Save Link'
              )}
            </button>
          </div>
        </motion.form>
      )}
    </div>
  )
} 