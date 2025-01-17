import { useState } from 'react'
import { useUsers } from '@/app/hooks/useUsers'

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
  const user = users?.[0] // Get current user
  const [preferences, setPreferences] = useState<UserPreferences>({
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
  })

  const handlePreferenceChange = async (
    category: 'notification_preferences' | 'email_preferences',
    key: string,
    value: boolean
  ) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [category]: {
            ...preferences[category],
            [key]: value
          }
        })
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      setPreferences({
        ...preferences,
        [category]: {
          ...preferences[category],
          [key]: value
        }
      })
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      {/* Notification Preferences */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="email_notifications"
                type="checkbox"
                checked={preferences.notification_preferences.email_notifications}
                onChange={e => handlePreferenceChange(
                  'notification_preferences',
                  'email_notifications',
                  e.target.checked
                )}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="email_notifications" className="font-medium text-gray-700">
                Email Notifications
              </label>
              <p className="text-gray-500">Receive notifications via email</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="push_notifications"
                type="checkbox"
                checked={preferences.notification_preferences.push_notifications}
                onChange={e => handlePreferenceChange(
                  'notification_preferences',
                  'push_notifications',
                  e.target.checked
                )}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="push_notifications" className="font-medium text-gray-700">
                Push Notifications
              </label>
              <p className="text-gray-500">Receive notifications in your browser</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="status_updates"
                type="checkbox"
                checked={preferences.notification_preferences.status_updates}
                onChange={e => handlePreferenceChange(
                  'notification_preferences',
                  'status_updates',
                  e.target.checked
                )}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
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
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="newsletter"
                type="checkbox"
                checked={preferences.email_preferences.newsletter}
                onChange={e => handlePreferenceChange(
                  'email_preferences',
                  'newsletter',
                  e.target.checked
                )}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="newsletter" className="font-medium text-gray-700">
                Newsletter
              </label>
              <p className="text-gray-500">Receive our monthly newsletter</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="product_updates"
                type="checkbox"
                checked={preferences.email_preferences.product_updates}
                onChange={e => handlePreferenceChange(
                  'email_preferences',
                  'product_updates',
                  e.target.checked
                )}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="product_updates" className="font-medium text-gray-700">
                Product Updates
              </label>
              <p className="text-gray-500">Stay informed about new features and improvements</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="promotional_offers"
                type="checkbox"
                checked={preferences.email_preferences.promotional_offers}
                onChange={e => handlePreferenceChange(
                  'email_preferences',
                  'promotional_offers',
                  e.target.checked
                )}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
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