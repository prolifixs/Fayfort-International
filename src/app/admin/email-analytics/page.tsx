'use client'

import { useState, useEffect } from 'react'
import { EmailAnalyticsDashboard } from '@/app/components/email/EmailAnalyticsDashboard'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import LoadingSpinner from '@/app/components/LoadingSpinner'

export default function EmailAnalyticsPage() {
  const [emailIds, setEmailIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEmailIds()
  }, [timeRange])

  const fetchEmailIds = async () => {
    try {
      const startDate = new Date()
      if (timeRange === 'day') startDate.setDate(startDate.getDate() - 1)
      if (timeRange === 'week') startDate.setDate(startDate.getDate() - 7)
      if (timeRange === 'month') startDate.setDate(startDate.getDate() - 30)

      const { data, error } = await supabase
        .from('email_tracking')
        .select('email_id')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      setEmailIds(data.map(item => item.email_id))
    } catch (err) {
      console.error('Error fetching email IDs:', err)
      setError('Failed to load email data')
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Email Analytics</h1>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : emailIds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No email data available for the selected time range.</p>
        </div>
      ) : (
        <EmailAnalyticsDashboard emailIds={emailIds} />
      )}
    </div>
  )
} 