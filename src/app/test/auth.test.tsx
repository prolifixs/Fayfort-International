import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import LoginPage from '../login/page'
import RegisterPage from '../register/page'
import { renderHook } from '@testing-library/react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '../components/lib/supabase'
import { User } from '@supabase/supabase-js'

// Mock supabase client
vi.mock('@/app/components/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}))

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('should handle login submission', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('should render register form', () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    )
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('should handle social login', async () => {
    const mockSignInWithGoogle = vi.fn();
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('should handle email verification', async () => {
    console.log('Starting email verification test');
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.resendVerificationEmail('test@example.com');
    });

    expect(supabase.auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: expect.any(String)
    });
    console.log('Email verification test completed');
  });

  it('should update email verification status', async () => {
    console.log('Starting verification status test');
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User;

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { 
        session: { 
          user: mockUser,
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer'
        } 
      },
      error: null
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await waitFor(() => {
      expect(result.current.isEmailVerified).toBe(true);
    });
    console.log('Verification status test completed');
  });

  // Add more tests...
}) 