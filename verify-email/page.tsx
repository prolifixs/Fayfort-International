'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/app/components/LoadingSpinner'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyEmail, user } = useAuth()
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    if (!token || type !== 'signup' || !user?.email) {
      setError('Invalid verification link')
      setVerifying(false)
      return
    }

    async function verify() {
      try {
        if (!token || !user?.email) return;
        await verifyEmail(token, user.email)
        router.push('/login?verified=true')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify email')
      } finally {
        setVerifying(false)
      }
    }

    verify()
  }, [router, searchParams, verifyEmail, user])

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return null
}