'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'customer' | 'supplier')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();

  const checkUserRole = (user: any) => {
    // Check user_metadata first
    const metadataRole = user.user_metadata?.role;
    if (metadataRole) return metadataRole;

    // Check the main role field
    const mainRole = user.role;
    if (mainRole && mainRole !== 'authenticated') return mainRole;

    // If no valid role found, return null or a default
    return null;
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading) {
        if (!user) {
          router.push('/login');
          return;
        }

        const userRole = checkUserRole(user);
        console.log('Current user role:', userRole); // Debug log

        if (allowedRoles && !allowedRoles.includes(userRole)) {
          console.log('Access denied:', {
            userRole,
            allowedRoles,
            metadata: user.user_metadata
          });
          router.push('/unauthorized');
        }
      }
    };

    checkAccess();
  }, [user, isLoading, router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
} 