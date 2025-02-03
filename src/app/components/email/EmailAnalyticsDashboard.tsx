'use client'

import { useEffect, useState } from 'react'
import { EmailTrackingData } from '@/app/components/types/email'
import { emailTrackingService } from '@/services/emailTrackingService'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface EmailAnalyticsDashboardProps {
  emailIds: string[]
}

export function EmailAnalyticsDashboard({ emailIds }: EmailAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<EmailTrackingData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await Promise.all(
          emailIds.map(id => emailTrackingService.getEmailAnalytics(id))
        )
        setAnalyticsData(data)
      } catch (err) {
        setError('Failed to load analytics data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [emailIds])

  if (isLoading) return <div>Loading analytics...</div>
  if (error) return <div>Error: {error}</div>

  const chartData = analyticsData.map(data => ({
    emailId: data.email_id,
    opens: data.open_count,
    clicks: data.email_click_tracking?.length || 0,
    deliveryStatus: data.delivery_status
  }))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Email Analytics</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold">Total Sent</h3>
          <p className="text-2xl">{analyticsData.length}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold">Open Rate</h3>
          <p className="text-2xl">
            {Math.round(
              (analyticsData.filter(d => d.open_count > 0).length / analyticsData.length) * 100
            )}%
          </p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold">Click Rate</h3>
          <p className="text-2xl">
            {Math.round(
              (analyticsData.filter(d => (d.email_click_tracking?.length ?? 0) > 0).length / analyticsData.length) * 100
            )}%
          </p>
        </div>
      </div>

      <div className="mt-8">
        <BarChart width={800} height={400} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="emailId" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="opens" fill="#8884d8" name="Opens" />
          <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
        </BarChart>
      </div>
    </div>
  )
} 