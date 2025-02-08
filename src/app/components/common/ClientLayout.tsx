'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navigation from './Navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const userRole = user?.user_metadata?.role;
  console.log('🎨 ClientLayout Render:', { userRole, isLoading, userId: user?.id });

  if (isLoading) {
    return <LoadingSpinner />;
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
    <AuthProvider>
      <Layout>{children}</Layout>
    </AuthProvider>
  );
}