'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/app/components/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check both session storage and local storage
      const session = sessionStorage.getItem('session') || localStorage.getItem('session');
      if (session) {
        setUser(JSON.parse(session));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual authentication
      const mockUser: User = {
        id: 'admin1',
        name: 'Admin User',
        email: email,
        role: 'admin',
      };

      // Store in either localStorage (remember me) or sessionStorage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('session', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear both storages to ensure complete logout
      localStorage.removeItem('session');
      sessionStorage.removeItem('session');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 