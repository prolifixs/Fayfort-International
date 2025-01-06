'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { checkPasswordStrength } from '@/app/utils/passwordStrength'
import { validateEmail, validatePassword } from '../utils/auth'

interface RegisterFormData {
  name: string
  email: string
  password: string
  role: 'customer' | 'supplier'
}

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth()
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    checks: {
      length: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumbers: false,
      hasSpecialChar: false
    },
    text: '',
    color: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = formData.email.trim().toLowerCase();
    setFormData(prev => ({ ...prev, email: sanitizedEmail }));

    if (!validateEmail(sanitizedEmail)) {
      console.log('❌ Email validation failed');
      setError('Please enter a valid email');
      return;
    }

    if (!validatePassword(formData.password)) {
      console.log('❌ Password validation failed');
      setError('Password must meet the requirements');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log('📤 Sending signup request...');
      await signUp(
        sanitizedEmail,      // email
        formData.password,   // password
        formData.role,       // role
        formData.name        // name
      );
      
      console.log('✅ Signup request successful, redirecting...');
      localStorage.setItem('verificationEmail', sanitizedEmail);
      router.push('/check-email');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register');
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true)
    setError(null)

    try {
      if (provider === 'google') {
        await signInWithGoogle()
      } else {
        await signInWithFacebook()
      }
      // Social login redirects automatically through Supabase
    } catch (err) {
      console.error('Social login error:', err)
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setLoading(false)
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-full transition-all duration-300 ${
                            level <= passwordStrength.score
                              ? passwordStrength.color === 'red'
                                ? 'bg-red-500'
                                : passwordStrength.color === 'yellow'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-transparent'
                          }`}
                          style={{ width: '20%', float: 'left' }}
                        />
                      ))}
                    </div>
                    <span className={`text-sm font-medium
                      ${passwordStrength.color === 'red' ? 'text-red-500' : ''}
                      ${passwordStrength.color === 'yellow' ? 'text-yellow-500' : ''}
                      ${passwordStrength.color === 'green' ? 'text-green-500' : ''}
                    `}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  
                  <ul className="mt-2 text-sm space-y-1">
                    <li className={`flex items-center ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                    </li>
                    <li className={`flex items-center ${passwordStrength.checks.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.checks.hasUpperCase ? '✓' : '○'} One uppercase letter
                    </li>
                    <li className={`flex items-center ${passwordStrength.checks.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.checks.hasLowerCase ? '✓' : '○'} One lowercase letter
                    </li>
                    <li className={`flex items-center ${passwordStrength.checks.hasNumbers ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.checks.hasNumbers ? '✓' : '○'} One number
                    </li>
                    <li className={`flex items-center ${passwordStrength.checks.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.checks.hasSpecialChar ? '✓' : '○'} One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I want to
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'customer' | 'supplier' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="customer">Buy Products</option>
                <option value="supplier">Sell Products</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner /> : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Sign up with Google</span>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  />
                </svg>
              </button>

              <button
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Sign up with Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </Link>
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 