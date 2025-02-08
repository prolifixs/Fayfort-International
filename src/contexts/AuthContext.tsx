'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { Session, User } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { WeakPassword } from '@supabase/supabase-js';
import { supabase, getRedirectUrl } from '@/app/components/lib/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import { supabaseAdmin } from '@/app/components/lib/supabase';


interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    user: User;
    session: Session;
    weakPassword?: WeakPassword;
  }>;
  signUp: (email: string, password: string, role: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: (options?: { role?: string, isRegistration?: boolean }) => Promise<void>;
  signInWithFacebook: (options?: { role?: string, isRegistration?: boolean }) => Promise<void>;
  isEmailVerified: boolean;
  resendVerificationEmail: (email: string) => Promise<void>;
  verifyEmail: (token: string, email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Add debug logging
  const debugAuth = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Auth Debug: ${message}`, data || '');
    }
  };

  const signIn = async (email: string, password: string) => {
    debugAuth('Attempting sign in', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    debugAuth('Sign in successful', { user: data.user });
    return data;
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

  const refreshSession = async () => {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return;
    }
    
    // Force reload user metadata
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
      return;
    }
  };

  const adminMethods = {
    updateUserRole: async (userId: string, role: string) => {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { user_metadata: { role } }
      );
      if (error) throw error;
    },
    
    deleteUser: async (userId: string) => {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      debugAuth('Initializing auth');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        debugAuth('Got session', { session });
        
        if (session) {
          setSession(session);
          setUser(session.user);
          debugAuth('Session exists, user set', { 
            user: session.user,
            role: session.user.user_metadata?.role 
          });
        }
      } catch (error) {
        debugAuth('Auth initialization error', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        debugAuth('Auth state changed', { event, session });
        if (event === 'SIGNED_IN') {
          setSession(session);
          setUser(session?.user ?? null);
          // Don't set loading to false immediately on sign in
          // Let the redirect happen first
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      debugAuth('Cleaning up auth subscription');
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
      signInWithGoogle: async (options?: { role?: string, isRegistration?: boolean }) => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              ...(options?.role && { role: options.role }),
              ...(options?.isRegistration && { registration: 'true' })
            }
          }
        });
        if (error) throw error;
      },
      signInWithFacebook: async (options?: { role?: string, isRegistration?: boolean }) => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              ...(options?.role && { role: options.role }),
              ...(options?.isRegistration && { registration: 'true' })
            }
          }
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
      },
      refreshSession
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