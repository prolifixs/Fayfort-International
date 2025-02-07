'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/useToast'
import { Switch } from '@/app/components/ui/switch'
import { Card, CardHeader, CardContent } from '@/app/components/ui/card'

interface EmailPreferences {
  invoice_ready: boolean
  status_change: boolean
  payment_received: boolean
  promotional: boolean
}

export function EmailPreferences() {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    invoice_ready: true,
    status_change: true,
    payment_received: true,
    promotional: false
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_preferences')
        .select('email_preferences')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      if (data?.email_preferences) {
        setPreferences(data.email_preferences)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to load email preferences',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function updatePreference(key: keyof EmailPreferences, value: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newPreferences = { ...preferences, [key]: value }
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_preferences: newPreferences
        })

      if (error) throw error

      setPreferences(newPreferences)
      toast({
        title: 'Preferences Updated',
        description: 'Your email preferences have been saved',
      })
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to update preferences',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Email Notifications</h2>
        <p className="text-sm text-gray-500">
          Choose which emails you'd like to receive
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Invoice Ready</h3>
            <p className="text-sm text-gray-500">
              Receive emails when new invoices are generated
            </p>
          </div>
          <Switch
            checked={preferences.invoice_ready}
            onCheckedChange={(checked) => updatePreference('invoice_ready', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Status Changes</h3>
            <p className="text-sm text-gray-500">
              Get notified when invoice status changes
            </p>
          </div>
          <Switch
            checked={preferences.status_change}
            onCheckedChange={(checked) => updatePreference('status_change', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Payment Received</h3>
            <p className="text-sm text-gray-500">
              Receive confirmation when payments are processed
            </p>
          </div>
          <Switch
            checked={preferences.payment_received}
            onCheckedChange={(checked) => updatePreference('payment_received', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Promotional Emails</h3>
            <p className="text-sm text-gray-500">
              Receive updates about new features and offers
            </p>
          </div>
          <Switch
            checked={preferences.promotional}
            onCheckedChange={(checked) => updatePreference('promotional', checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
} 