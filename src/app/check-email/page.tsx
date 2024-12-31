'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const resetEmail = localStorage.getItem('resetEmail');
    if (!resetEmail) {
      router.push('/forgot-password');
      return;
    }
    setEmail(resetEmail);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
          Check your email
        </h2>
        {email && (
          <p className="text-gray-600 mb-4">
            We&apos;ve sent password reset instructions to <strong>{email}</strong>
          </p>
        )}
        <p className="text-gray-500 mb-8">
          Click the link in the email to reset your password. If you don&apos;t see the email, check your spam folder.
        </p>
        <div className="space-y-4">
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:text-blue-500 block"
          >
            Try another email address
          </Link>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-500 block"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
} 