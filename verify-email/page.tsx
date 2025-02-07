'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    async function verify() {
      try {
        if (!token || type !== 'signup') {
          throw new Error('Invalid verification link');
        }

        // First verify the email
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (verifyError) throw verifyError;

        // Get the user after verification
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('No user found');

        console.log('Updating user status:', user.id); // Add logging

        // Update both status and email_verified in public.users
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            status: 'active',
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
        }

        toast.success('Email verified successfully');
        router.push('/login?verified=true');
      } catch (err) {
        console.error('Verification error:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify email');
        toast.error('Verification failed');
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [router, searchParams, supabase]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 text-sm text-blue-600 hover:text-blue-500"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return null;
} 