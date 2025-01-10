'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'signup') {
          throw new Error('Invalid verification link');
        }

        const supabase = createClientComponentClient();
        
        // Call the verify API route
        const response = await fetch(`/api/auth/verify?token=${token}&type=${type}`);
        if (!response.ok) {
          throw new Error('Verification failed');
        }

        toast.success('Email verified successfully');
        router.push('/login?verified=true');
      } catch (err) {
        console.error('Verification error:', err);
        setError(err instanceof Error ? err.message : 'Verification failed');
        toast.error('Email verification failed');
        router.push('/login?error=verification_failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [router, searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
        <p className="ml-2">Verifying your email...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}