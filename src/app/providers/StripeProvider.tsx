'use client'

import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/app/components/lib/stripe/config'
import { ReactNode } from 'react'

export function StripeProvider({ children }: { children: ReactNode }) {
  const stripePromise = getStripe()

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  )
} 