'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/components/lib/supabase';
import { roleOf } from '@/lib/auth/role';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

/**
 * Shows its children only to a signed-in user whose role is allowed. This is for the interface;
 * the proxy decides which pages open at all, and the database's row-level security decides what
 * each user can read or change.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // getUser() asks Supabase; getSession() would trust whatever is stored in the browser.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        if (!allowedRoles.includes(roleOf(user))) {
          router.push('/unauthorized');
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error('ProtectedRoute: auth check failed:', error instanceof Error ? error.message : error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router, allowedRoles]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthorized ? children : null;
}
