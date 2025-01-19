'use client'

import { useState, useEffect } from 'react'
import { useUsers } from '@/app/hooks/useUsers'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/app/hooks/useToast'
import LoadingSpinner from '@/app/components/LoadingSpinner'

interface UserPreferences {
  notification_preferences: {
    email_notifications: boolean
    push_notifications: boolean
    status_updates: boolean
    invoice_ready: boolean
    payment_received: boolean
  }
  email_preferences: {
    marketing_emails: boolean
    newsletter: boolean
    product_updates: boolean
    promotional_offers: boolean
  }
}

export function Preferences() {
  const { users } = useUsers()
  const user = users?.[0]
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (user?.id) {
      loadPreferences()
      setupRealtimeSubscription()
    }
  }, [user?.id])

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('preferences_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Preferences changed:', payload)
          if (payload.eventType === 'UPDATE') {
            setPreferences({
              notification_preferences: payload.new.notification_preferences,
              email_preferences: payload.new.email_preferences
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_preferences, email_preferences')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No preferences found, create default preferences
        const defaultPreferences = {
          notification_preferences: {
            email_notifications: true,
            push_notifications: true,
            status_updates: true,
            invoice_ready: true,
            payment_received: true
          },
          email_preferences: {
            marketing_emails: false,
            newsletter: false,
            product_updates: true,
            promotional_offers: false
          }
        }

        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user?.id,
            ...defaultPreferences
          })

        if (insertError) throw insertError
        setPreferences(defaultPreferences)
      } else if (error) {
        throw error
      } else {
        setPreferences(data)
      }
    } catch (err) {
      const error = err as Error
      console.error('Error loading preferences:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load preferences',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceChange = async (
    category: 'notification_preferences' | 'email_preferences',
    key: string,
    value: boolean
  ) => {
    if (!preferences || !user?.id) return

    // Optimistic update
    const previousPreferences = { ...preferences }
    setPreferences({
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value
      }
    })
    
    setIsSaving(true)
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('user_preferences')
        .select(category)
        .eq('user_id', user.id)
        .single() as { 
          data: UserPreferences | null, 
          error: any 
        }

      if (fetchError) throw fetchError

      // Now TypeScript knows the shape of currentData
      const updatedPreferences = {
        ...(currentData as UserPreferences)[category],
        [key]: value
      }

      const { error } = await supabase
        .from('user_preferences')
        .update({ [category]: updatedPreferences })
        .eq('user_id', user.id)

      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Preferences updated successfully'
      })
    } catch (err) {
      // Revert optimistic update
      setPreferences(previousPreferences)
      const error = err as Error
      console.error('Error updating preferences:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update preferences',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    )
  }

  if (!preferences) return null

  return (
    <div className="space-y-8">
      {/* Notification Preferences */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <div className="relative">
                <input
                  id="email_notifications"
                  type="checkbox"
                  checked={preferences.notification_preferences.email_notifications}
                  onChange={e => handlePreferenceChange(
                    'notification_preferences',
                    'email_notifications',
                    e.target.checked
                  )}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="email_notifications" className="font-medium text-gray-700">
                Email Notifications
              </label>
              <p className="text-gray-500">Receive notifications via email</p>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <div className="relative">
                <input
                  id="push_notifications"
                  type="checkbox"
                  checked={preferences.notification_preferences.push_notifications}
                  onChange={e => handlePreferenceChange(
                    'notification_preferences',
                    'push_notifications',
                    e.target.checked
                  )}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="push_notifications" className="font-medium text-gray-700">
                Push Notifications
              </label>
              <p className="text-gray-500">Receive notifications in your browser</p>
            </div>
          </div>

          {/* Status Updates */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <div className="relative">
                <input
                  id="status_updates"
                  type="checkbox"
                  checked={preferences.notification_preferences.status_updates}
                  onChange={e => handlePreferenceChange(
                    'notification_preferences',
                    'status_updates',
                    e.target.checked
                  )}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="status_updates" className="font-medium text-gray-700">
                Status Updates
              </label>
              <p className="text-gray-500">Get notified when your request status changes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Preferences */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Email Preferences
        </h3>
        <div className="space-y-4">
          {/* Newsletter */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <div className="relative">
                <input
                  id="newsletter"
                  type="checkbox"
                  checked={preferences.email_preferences.newsletter}
                  onChange={e => handlePreferenceChange(
                    'email_preferences',
                    'newsletter',
                    e.target.checked
                  )}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="newsletter" className="font-medium text-gray-700">
                Newsletter
              </label>
              <p className="text-gray-500">Receive our monthly newsletter</p>
            </div>
          </div>

          {/* Product Updates */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <div className="relative">
                <input
                  id="product_updates"
                  type="checkbox"
                  checked={preferences.email_preferences.product_updates}
                  onChange={e => handlePreferenceChange(
                    'email_preferences',
                    'product_updates',
                    e.target.checked
                  )}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="product_updates" className="font-medium text-gray-700">
                Product Updates
              </label>
              <p className="text-gray-500">Stay informed about new features and improvements</p>
            </div>
          </div>

          {/* Promotional Offers */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <div className="relative">
                <input
                  id="promotional_offers"
                  type="checkbox"
                  checked={preferences.email_preferences.promotional_offers}
                  onChange={e => handlePreferenceChange(
                    'email_preferences',
                    'promotional_offers',
                    e.target.checked
                  )}
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="promotional_offers" className="font-medium text-gray-700">
                Promotional Offers
              </label>
              <p className="text-gray-500">Receive special offers and promotions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
