'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (session) {
          // Clear the verification email from storage
          localStorage.removeItem('verificationEmail');
          // Redirect to dashboard after successful verification
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/login');
      }
    };

    handleCallback();
  }, [session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h2 className="text-xl font-semibold mt-4">Verifying your email...</h2>
        <p className="text-gray-500">Please wait while we complete the process.</p>
      </div>
    </div>
  );
} 