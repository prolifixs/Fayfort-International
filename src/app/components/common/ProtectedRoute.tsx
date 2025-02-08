'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, supabaseAdmin } from '@/app/components/lib/supabase';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      console.log('🔒 ProtectedRoute: Starting auth check');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔑 ProtectedRoute: Session:', session);
        
        if (!session) {
          console.log('❌ ProtectedRoute: No session found');
          router.push('/login');
          return;
        }

        const roles = await checkRoleConsistency(session.user.id);
        console.log('Role comparison:', roles);

        // Use auth metadata role for authorization
        const userRole = session.user.user_metadata?.role || await fallbackToDbRole(session.user.id);
        console.log('🔒 ProtectedRoute Role Check:', {
          userRole,
          allowedRoles,
          isAllowed: allowedRoles.includes(userRole),
          path: window.location.pathname
        });
        
        if (!allowedRoles.includes(userRole)) {
          console.log('❌ ProtectedRoute: Unauthorized role:', userRole);
          router.push('/unauthorized');
          return;
        }

        // If roles don't match, synchronize them
        if (roles.authRole !== roles.dbRole) {
          await supabaseAdmin
            .from('users')
            .update({ role: roles.authRole })
            .eq('id', session.user.id);
        }

        console.log('✅ ProtectedRoute: Access granted');
        setIsAuthorized(true);
      } catch (error) {
        console.error('🚫 ProtectedRoute: Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    async function checkRoleConsistency(userId: string) {
      console.log('🔍 Checking role consistency');
      
      // Check auth metadata role
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      console.log('Auth metadata role:', authUser?.user?.user_metadata?.role);
      
      // Check database role
      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      console.log('Database role:', dbUser?.role);
      
      return {
        authRole: authUser?.user?.user_metadata?.role,
        dbRole: dbUser?.role
      };
    }

    async function fallbackToDbRole(userId: string) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      return dbUser?.role;
    }

    checkAuth();
  }, [router, allowedRoles]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthorized ? children : null;
} 