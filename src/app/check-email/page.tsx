'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function CheckEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('verificationEmail');
    if (!storedEmail) {
      router.push('/register');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  const handleResendEmail = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClientComponentClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) throw resendError;
      toast.success('Verification email sent successfully');
    } catch (err) {
      console.error('Resend error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend email');
      toast.error('Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Check your inbox
          </h2>
          <div className="flex justify-center mb-6">
            <svg
              className="w-16 h-16 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            We've sent a verification link to
          </p>
          <p className="text-lg font-semibold text-blue-600 mb-6">{email}</p>
          <p className="text-sm text-gray-500 mb-8">
            Click the link in the email to verify your account. If you don't see it, check your spam folder.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-4">
              Didn't receive the email?
            </p>
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Sending...
                </>
              ) : (
                'Resend verification email'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 