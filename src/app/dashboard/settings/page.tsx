'use client'

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/Tabs";
import { CardManagement } from '@/app/components/payment/CardManagement';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { CreditCard, User, Bell, Shield } from 'lucide-react';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Add logging to verify Stripe initialization
console.log('Stripe initialization:', {
  hasPublicKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripePromise: !!stripePromise
});

const tabStyles = {
  list: "grid w-full grid-cols-4 mb-8",
  trigger: "flex items-center gap-2",
  content: "space-y-4"
};

const options: StripeElementsOptions = {
  appearance: {
    theme: 'stripe' as const,
  },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('payment');
  const [clientSecret, setClientSecret] = useState<string>();

  useEffect(() => {
    fetch('/api/payments/create-setup-intent')
      .then(res => res.json())
      .then(data => {
        console.log('Setup intent received:', data);
        setClientSecret(data.clientSecret);
      })
      .catch(err => console.error('Setup intent error:', err));
  }, []);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={tabStyles.list}>
            <TabsTrigger value="payment">
              <div className={tabStyles.trigger}>
                <CreditCard className="h-4 w-4" />
                Payment Methods
              </div>
            </TabsTrigger>
            <TabsTrigger value="profile">
              <div className={tabStyles.trigger}>
                <User className="h-4 w-4" />
                Profile
              </div>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <div className={tabStyles.trigger}>
                <Bell className="h-4 w-4" />
                Notifications
              </div>
            </TabsTrigger>
            <TabsTrigger value="security">
              <div className={tabStyles.trigger}>
                <Shield className="h-4 w-4" />
                Security
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment">
            <div className={tabStyles.content}>
              <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                  {clientSecret ? (
                    <Elements 
                      stripe={stripePromise} 
                      options={{
                        clientSecret,
                        appearance: { theme: 'stripe' as const }
                      }}
                    >
                      <CardManagement />
                    </Elements>
                  ) : (
                    <div>Loading payment system...</div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className={tabStyles.content}>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
                {/* Profile settings content */}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className={tabStyles.content}>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                {/* Notification settings content */}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className={tabStyles.content}>
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                {/* Security settings content */}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 