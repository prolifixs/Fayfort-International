'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { tokenService } from '@/services/tokenService';
import { emailService } from '@/services/emailService';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    if (token) {
      const { isValid } = tokenService.validateResetToken(token);
      setIsValidToken(isValid);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!token || !isValidToken) {
      setMessage('Invalid or expired reset token');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      // In a real app, send new password to server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { email } = tokenService.validateResetToken(token);
      if (email) {
        await emailService.sendPasswordResetSuccessEmail(email);
      }
      
      // Remove the used token
      tokenService.removeToken(token);
      
      setMessage('Password successfully reset');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: Error | unknown) {
      setMessage(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className={`rounded-md p-4 ${
              message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
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
                'Reset Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 