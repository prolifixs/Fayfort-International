'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  isEmailVerified: boolean;
  resendVerificationEmail: (email: string) => Promise<void>;
  verifyEmail: (token: string, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getRedirectUrl = () => {
  return `${window.location.origin}/auth/callback`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, role: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          role,
          name
        },
        emailRedirectTo: getRedirectUrl()
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Redirect based on role
          const userRole = session.user.user_metadata?.role;
          if (!window.location.pathname.includes('/auth/callback')) {
            router.push(userRole === 'admin' ? '/admin' : '/dashboard');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          const userRole = session?.user?.user_metadata?.role;
          router.push(userRole === 'admin' ? '/admin' : '/dashboard');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
      },
      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: getRedirectUrl() }
        });
        if (error) throw error;
      },
      signInWithFacebook: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: { redirectTo: getRedirectUrl() }
        });
        if (error) throw error;
      },
      isEmailVerified: user?.email_confirmed_at !== null,
      resendVerificationEmail: async (email: string) => {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        if (error) throw error;
      },
      verifyEmail: async (token: string, email: string) => {
        const { error } = await supabase.auth.verifyOtp({
          token,
          type: 'signup',
          email
        });
        if (error) throw error;
      }
    }),
    [user, session, loading, router]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}