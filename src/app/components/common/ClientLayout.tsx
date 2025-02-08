'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { Toaster } from 'react-hot-toast';
import Navigation from './Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import LoadingSpinner from './LoadingSpinner';
import { useEffect } from 'react';
import { useLoadingSafety } from '@/app/hooks/useLoadingSafety';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { startLoading, endLoading } = useLoading();
  const isStuck = useLoadingSafety(5000, isLoading);
  const userRole = user?.user_metadata?.role;

  useEffect(() => {
    if (isLoading) {
      startLoading('auth');
    } else {
      endLoading('auth');
    }
  }, [isLoading, startLoading, endLoading]);

  if (isLoading && !isStuck) {
    return <LoadingSpinner />;
  }

  if (isStuck) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation userRole={userRole} />
      <main className="flex-grow pt-16 container mx-auto px-4">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <AuthProvider>
        <Layout>{children}</Layout>
      </AuthProvider>
    </LoadingProvider>
  );
}