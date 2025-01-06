import { AuthError } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid login credentials',
  EMAIL_NOT_CONFIRMED: 'Email not confirmed',
  RATE_LIMIT_EXCEEDED: 'Too many requests',
  INVALID_CLAIM: 'Invalid claim',
  EMAIL_TAKEN: 'Email already registered'
} as const

export function handleAuthError(error: AuthError | Error | unknown) {
  if (!error) return 'An unknown error occurred'
  
  const message = error instanceof Error ? error.message : String(error)
  
  // Map common Supabase auth errors to user-friendly messages
  switch (message) {
    case 'Invalid login credentials':
      return AUTH_ERRORS.INVALID_CREDENTIALS
    case 'Email not confirmed':
      return AUTH_ERRORS.EMAIL_NOT_CONFIRMED
    case 'Too many requests':
      return AUTH_ERRORS.RATE_LIMIT_EXCEEDED
    case 'Invalid claim':
      return AUTH_ERRORS.INVALID_CLAIM
    case 'Email already registered':
      return AUTH_ERRORS.EMAIL_TAKEN
    default:
      return message
  }
}

export function showAuthError(error: AuthError | Error | unknown) {
  const message = handleAuthError(error)
  toast.error(message)
  return message
}

export function showAuthSuccess(message: string) {
  toast.success(message)
  return message
}

export function validateEmail(email: string) {
  console.log('🔍 Validating email:', email);
  // More strict email regex
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  const isValid = emailRegex.test(email);
  console.log('📝 Email validation result:', isValid);
  return isValid;
}

export function validatePassword(password: string): boolean {
  return password.length >= 6
} 