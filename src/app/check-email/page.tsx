'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FiMail, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';

export default function CheckEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const { resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const verificationEmail = localStorage.getItem('verificationEmail');
    if (!verificationEmail) {
      router.push('/register');
      return;
    }
    setEmail(verificationEmail);
  }, [router]);

  const handleResendEmail = async () => {
    if (!email || isResending || resendTimer > 0) return;
    
    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((current) => {
          if (current <= 1) {
            clearInterval(interval);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <FiMail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
        </div>

        <div className="space-y-4">
          {email && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                We sent a verification link to
              </p>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {email}
              </p>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="space-y-3">
              <p className="text-sm text-blue-700">
                ✓ Click the link in the email to verify your account
              </p>
              <p className="text-sm text-blue-700">
                ✓ The link will expire in 24 hours
              </p>
              <p className="text-sm text-blue-700">
                ✓ Check your spam folder if you don't see the email
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={isResending || resendTimer > 0}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <FiRefreshCw className="animate-spin mr-2" />
            ) : resendTimer > 0 ? (
              `Resend available in ${resendTimer}s`
            ) : (
              <>
                <FiRefreshCw className="mr-2" />
                Resend verification email
              </>
            )}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
            >
              <FiArrowLeft className="mr-2" />
              Back to login
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Having trouble? <a href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
} 