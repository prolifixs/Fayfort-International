import { headers } from 'next/headers'
import ProtectedRoute from '@/app/components/common/ProtectedRoute'
import { supabaseAdmin } from '@/app/components/lib/supabase'
import { roleOf } from '@/lib/auth/role';

export async function generateMetadata() {
  const headersList = await headers()
  const token = headersList.get('authorization')
  
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (roleOf(user) !== 'admin') {
      return {
        title: 'Unauthorized'
      }
    }
  }

  return {
    title: 'Admin Dashboard'
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  )
} 