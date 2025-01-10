import { headers } from 'next/headers'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import { supabaseAdmin } from '@/app/components/lib/supabase'

export async function generateMetadata() {
  const headersList = headers()
  const token = headersList.get('authorization')
  
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (user?.user_metadata?.role !== 'admin') {
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