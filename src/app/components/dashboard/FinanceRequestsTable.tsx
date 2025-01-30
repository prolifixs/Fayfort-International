'use client'

import { useState, useEffect } from 'react'
import { 
  Wallet, 
  ArrowRightLeft, 
  CreditCard, 
  Bitcoin, 
  DollarSign, 
  Building2, 
  ShoppingCart,
  Mail,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/useToast'

export function FinanceRequestsTable() {
  const [email, setEmail] = useState('')
  const [useCurrentEmail, setUseCurrentEmail] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOnWaitlist, setIsOnWaitlist] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const features = [
    {
      icon: <Wallet className="h-8 w-8 text-indigo-500" />,
      title: "Multi-Currency Wallet",
      description: "Store and manage multiple currencies in one secure place"
    },
    {
      icon: <ArrowRightLeft className="h-8 w-8 text-green-500" />,
      title: "Currency Exchange",
      description: "Competitive rates for USD and CNY exchanges"
    },
    {
      icon: <CreditCard className="h-8 w-8 text-blue-500" />,
      title: "External Transfers",
      description: "Transfer to PayPal and Payoneer seamlessly"
    },
    {
      icon: <Bitcoin className="h-8 w-8 text-orange-500" />,
      title: "Crypto Integration",
      description: "Buy and trade our native token and USDT"
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-purple-500" />,
      title: "Shopping Integration",
      description: "Use your wallet balance for product purchases"
    }
  ]

  // Check waitlist status on mount
  useEffect(() => {
    checkWaitlistStatus()
  }, [])

  const checkWaitlistStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: existing } = await supabase
        .from('finance_waitlist')
        .select('id')
        .eq('email', user.email)
        .single()

      setIsOnWaitlist(!!existing)
    } catch (error) {
      console.error('Error checking waitlist status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const emailToUse = useCurrentEmail ? user?.email : email

      // Check if already in waitlist
      const { data: existing } = await supabase
        .from('finance_waitlist')
        .select('id')
        .eq('email', emailToUse)
        .single()

      if (existing) {
        toast({
          title: "Already registered",
          description: "You're already on our waitlist!",
          variant: 'default'
        })
        setIsOnWaitlist(true)
        return
      }

      const { error } = await supabase
        .from('finance_waitlist')
        .insert([{
          email: emailToUse,
          user_id: user?.id || null,
          source: user ? 'website' : 'external',
          notification_preferences: {
            product_updates: true,
            launch_notification: true
          }
        }])

      if (error) throw error

      setEmail('')
      setIsOnWaitlist(true)
      
      toast({
        title: "You're on the list!",
        description: "We'll notify you when Finance features launch",
        variant: 'success'
      })
    } catch (error) {
      console.error('Waitlist error:', error)
      toast({
        title: 'Error joining waitlist',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Waitlist Status Card
  const WaitlistStatus = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )
    }

    if (isOnWaitlist) {
      return (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            You're on the Waitlist!
          </h3>
          <p className="text-green-700">
            We'll notify you when Finance features launch
          </p>
        </div>
      )
    }

    return (
      <form onSubmit={handleWaitlist} className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useCurrentEmail"
            checked={useCurrentEmail}
            onChange={(e) => setUseCurrentEmail(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="useCurrentEmail" className="text-sm text-gray-600">
            Use my current email
          </label>
        </div>

        {!useCurrentEmail && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Joining...</span>
            </>
          ) : (
            <span>Join Waitlist</span>
          )}
        </button>
      </form>
    )
  }

  return (
    <div className="min-h-[600px] py-12 px-4">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">
          Financial Freedom Coming Soon
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Transform how you handle international payments and currencies with our comprehensive financial suite
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="p-6 rounded-xl border border-gray-200 hover:border-indigo-500 transition-all duration-300 hover:shadow-lg"
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Waitlist Form/Status */}
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-semibold mb-6 text-center">Join the Waitlist</h2>
        <WaitlistStatus />
      </div>
    </div>
  )
} 