import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/app/components/types/database.types'

export class UserRequestDeletionService {
  private supabase = createClientComponentClient<Database>()

  async verifyUserOwnership(requestId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await this.supabase
      .from('requests')
      .select('user_id')
      .eq('id', requestId)
      .single()

    if (error || !data) return false
    return data.user_id === user.id
  }

  async isDeletionAllowed(requestId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { data, error } = await this.supabase
      .from('requests')
      .select(`
        status,
        admin_processing,
        invoice:invoices(status)
      `)
      .eq('id', requestId)
      .single()

    if (error || !data) {
      return { allowed: false, reason: 'Request not found' }
    }

    if (data.admin_processing) {
      return { allowed: false, reason: 'Request is currently being processed by admin' }
    }

    if (data.status !== 'pending') {
      return { allowed: false, reason: 'Only pending requests can be deleted' }
    }

    if (data.invoice?.[0]?.status === 'paid') {
      return { allowed: false, reason: 'Paid requests cannot be deleted' }
    }

    return { allowed: true }
  }

  async deleteRequest(requestId: string): Promise<void> {
    const isOwner = await this.verifyUserOwnership(requestId)
    if (!isOwner) {
      throw new Error('Unauthorized: You can only delete your own requests')
    }

    const { allowed, reason } = await this.isDeletionAllowed(requestId)
    if (!allowed) {
      throw new Error(reason || 'Request cannot be deleted')
    }

    const { error } = await this.supabase
      .from('requests')
      .delete()
      .eq('id', requestId)

    if (error) throw error
  }
} 