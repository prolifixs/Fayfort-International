'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from "@/app/components/ui/dialog"
import { CreditCard, Building2, Wallet, Eye, EyeOff, Info } from 'lucide-react'

interface PaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  invoiceId: string
}

export function PaymentDialog({ isOpen, onClose, amount, invoiceId }: PaymentDialogProps) {
  const [showBankInfo, setShowBankInfo] = useState(false)

  const paymentOptions = [
    {
      id: 'card',
      title: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay securely with your credit or debit card',
      info: 'Instant payment confirmation. 2.9% + $0.30 transaction fee.',
      disabled: false
    },
    {
      id: 'wire',
      title: 'Bank Wire Transfer',
      icon: Building2,
      description: 'Transfer directly from your bank account',
      info: 'Processing time: 1-3 business days. No transaction fee.',
      disabled: false
    },
    {
      id: 'wallet',
      title: 'My Wallet',
      icon: Wallet,
      description: 'Pay using your Fayfort wallet balance',
      info: 'Coming soon! Instant payment with zero fees.',
      disabled: true
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Select Payment Method</h2>
          <div className="space-y-4">
            {paymentOptions.map((option) => (
              <div
                key={option.id}
                className={`p-4 border rounded-lg ${
                  option.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-indigo-500 cursor-pointer'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <option.icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{option.title}</h3>
                    <p className="text-sm text-gray-500">{option.description}</p>
                    
                    {option.id === 'wire' && (
                      <div className="mt-2">
                        <button
                          onClick={() => setShowBankInfo(!showBankInfo)}
                          className="text-sm text-indigo-600 flex items-center"
                        >
                          {showBankInfo ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Hide bank information
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Show bank information
                            </>
                          )}
                        </button>
                        {showBankInfo && (
                          <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                            <p>Bank: Example Bank</p>
                            <p>Account Name: Fayfort Enterprise</p>
                            <p>Account Number: XXXX-XXXX-XXXX</p>
                            <p>Routing Number: XXXXXX</p>
                            <p>SWIFT: XXXXXXXX</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-start space-x-1 text-sm text-gray-500">
                      <Info className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>{option.info}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center text-lg font-medium">
              <span>Total Amount:</span>
              <span>${amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 