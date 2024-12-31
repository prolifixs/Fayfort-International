'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { emailService } from '@/services/emailService';
import { tokenService } from '@/services/tokenService';
import { rateLimiterService } from '@/services/rateLimiterService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Check rate limit
    const { allowed, remainingAttempts, msBeforeReset } = rateLimiterService.checkRateLimit(email);
    
    if (!allowed) {
      const minutesLeft = Math.ceil(msBeforeReset / 60000);
      setMessage(`Too many reset attempts. Please try again in ${minutesLeft} minutes.`);
      setIsLoading(false);
      return;
    }

    try {
      const resetToken = tokenService.generateResetToken(email);
      await emailService.sendPasswordResetEmail(email, resetToken);
      
      setMessage(
        remainingAttempts > 0 
          ? `If an account exists with this email, you will receive password reset instructions. (${remainingAttempts} attempts remaining)`
          : 'If an account exists with this email, you will receive password reset instructions.'
      );
      
      setTimeout(() => {
        router.push('/check-email');
      }, 3000);
    } catch (error: Error | unknown) {
      setMessage(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className={`rounded-md p-4 ${
              message.includes('error') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <LoadingSpinner className="w-5 h-5" />
              ) : (
                'Send reset instructions'
              )}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link 
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Return to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 