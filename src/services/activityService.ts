import { Database } from '@/app/components/types/database.types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient<Database>()

export const activityService = {
  async logActivity(data: {
    type: string
    content: string
    description?: string
    reference_id?: string
    metadata?: any
    user_email?: string
  }) {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    return supabase.from('activity_log').insert({
      ...data,
      user_id: user.user.id,
      user_email: data.user_email || user.user.email,
      created_at: new Date().toISOString()
    })
  },

  async getRecentActivities(limit = 10) {
    return supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
  }
} 