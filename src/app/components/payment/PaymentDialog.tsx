'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog"
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/app/components/ui/button'
import { CreditCard, Building2, Wallet, Eye, EyeOff, Info, Loader2, CheckCircle2, Plus, AlertCircle } from 'lucide-react'
import { paymentService } from '@/services/paymentService'
import { useToast } from '@/hooks/useToast'
import { Invoice } from '@/app/components/types/invoice'
import { notificationService } from '@/services/notificationService'
import { cardService, SavedCard } from '@/services/cardService'
import { SavedCardsList } from './SavedCardsList'
import { supabase } from '../lib/supabase'

type PaymentErrorType = 'card_declined' | 'insufficient_funds' | 'invalid_card' | 'processing_error' | 'authentication_error' | 'rate_limit' | 'other';

interface PaymentError {
  type: PaymentErrorType;
  message: string;
}

interface PaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice
  onPaymentSuccess: () => void
}

export function PaymentDialog({ isOpen, onClose, invoice, onPaymentSuccess }: PaymentDialogProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [showBankInfo, setShowBankInfo] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(true)
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [showNewCardForm, setShowNewCardForm] = useState(false)
  const { toast } = useToast()
  const [paymentAttempts, setPaymentAttempts] = useState(0)
  const MAX_PAYMENT_ATTEMPTS = 3

  useEffect(() => {
    if (isOpen) {
      loadSavedCards();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!invoice?.amount) {
      console.error('Invalid invoice data:', invoice);
      onClose();
      return;
    }
  }, [invoice, onClose]);

  useEffect(() => {
    console.log('Dialog state changed:', { showSuccessDialog, isOpen });
  }, [showSuccessDialog, isOpen]);

  const loadSavedCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const cards = await cardService.getSavedCards(user.id);
      setSavedCards(cards);
      
      // Select default card if exists
      const defaultCard = cards.find(card => card.is_default);
      if (defaultCard && selectedMethod === 'card') {
        setSelectedCardId(defaultCard.id);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const paymentOptions = [
    {
      id: 'card',
      title: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay with saved card or add a new one',
      info: 'Secure payment processing',
      disabled: false
    },
    {
      id: 'wire',
      title: 'Bank Wire Transfer',
      icon: Building2,
      description: 'Transfer directly from your bank account',
      info: 'Processing time: 1-3 business days',
      disabled: false
    },
    {
      id: 'wallet',
      title: 'My Wallet',
      icon: Wallet,
      description: 'Pay using your Fayfort wallet balance',
      info: 'Coming soon',
      disabled: true
    }
  ]

  const getErrorDetails = (error: any): PaymentError => {
    if (error?.type) {
      switch (error.type) {
        case 'card_error':
          return {
            type: 'card_declined',
            message: 'Your card was declined. Please try another card.'
          };
        case 'validation_error':
          return {
            type: 'invalid_card',
            message: 'Invalid card details. Please check and try again.'
          };
        case 'authentication_error':
          return {
            type: 'authentication_error',
            message: 'Payment authentication failed. Please try again.'
          };
        case 'rate_limit_error':
          return {
            type: 'rate_limit',
            message: 'Too many attempts. Please try again later.'
          };
        default:
          return {
            type: 'other',
            message: error.message || 'An unexpected error occurred.'
          };
      }
    }
    return {
      type: 'processing_error',
      message: 'Payment processing failed. Please try again.'
    };
  };

  const validatePaymentDetails = (): boolean => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return false;
    }

    if (selectedMethod === 'card') {
      if (!selectedCardId && !showNewCardForm) {
        setError('Please select a card or add a new one');
        return false;
      }
      if (showNewCardForm && !elements?.getElement(CardElement)) {
        setError('Please enter card details');
        return false;
      }
    }
    return true;
  };

  const logPaymentError = async (error: any, context: string) => {
    const errorDetails = {
      error,
      context,
      invoiceId: invoice.id,
      timestamp: new Date().toISOString(),
      paymentMethod: selectedMethod,
      attempts: paymentAttempts
    };

    console.error('Payment Error:', errorDetails);

    try {
      await notificationService.sendPaymentNotification(
        invoice.request_id,
        'payment_failed',
        {
          amount: invoice.amount,
          invoiceId: invoice.id
        }
      );
    } catch (notificationError) {
      console.error('Failed to log payment error:', notificationError);
    }
  };

  const handlePaymentFailure = (error: any) => {
    const errorDetails = getErrorDetails(error);
    setError(errorDetails.message);
    setIsProcessing(false);

    if (showNewCardForm) {
      elements?.getElement(CardElement)?.clear();
    }

    toast({
      title: "Payment Failed",
      description: errorDetails.message,
      variant: 'destructive'
    });

    if (paymentAttempts < MAX_PAYMENT_ATTEMPTS) {
      toast({
        title: "Recovery Options",
        description: "Please select a different payment method from the available options.",
        variant: 'default'
      });
      
      // Reset form for new attempt
      setShowNewCardForm(false);
      setSelectedMethod(null);
      setSelectedCardId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePaymentDetails()) return;
    
    if (paymentAttempts >= MAX_PAYMENT_ATTEMPTS) {
      toast({
        title: 'Too Many Failed Attempts',
        description: 'Please contact support or try again later',
        variant: 'destructive',
      });
      onClose();
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (selectedMethod === 'card') {
        const { clientSecret, customerId } = await paymentService.createPaymentIntent(invoice);
        let paymentResult;

        if (selectedCardId) {
          const savedCard = savedCards.find(card => card.id === selectedCardId);
          if (!savedCard) throw new Error('Selected card not found');

          paymentResult = await stripe!.confirmCardPayment(clientSecret, {
            payment_method: savedCard.stripe_payment_method_id
          });
        } else {
          const cardElement = elements?.getElement(CardElement);
          if (!cardElement) throw new Error('Card element not found');

          paymentResult = await stripe!.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
            }
          });
        }

        if (paymentResult.error) {
          throw paymentResult.error;
        }

        if (paymentResult.paymentIntent.status === 'succeeded') {
          await paymentService.processPayment(paymentResult.paymentIntent.id, invoice.id);
          setShowSuccessDialog(true);
          
          try {
            await notificationService.sendPaymentNotification(
              invoice.request_id,
              'payment_confirmed',
              {
                amount: invoice.amount,
                invoiceId: invoice.id,
                paymentId: paymentResult.paymentIntent.id
              }
            );
          } catch (notificationError) {
            console.error('Notification error:', notificationError);
          }
        }
      } else if (selectedMethod === 'wire') {
        toast({
          title: 'Wire Transfer Selected',
          description: 'Please use the bank information provided to complete your transfer.',
        });
      }
    } catch (err) {
      await logPaymentError(err, 'payment_submission');
      handlePaymentFailure(err);
      setPaymentAttempts(prev => prev + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewCard = async () => {
    setShowNewCardForm(true);
    setSelectedCardId(null);
  };

  return (
    <>
      <Dialog 
        open={isOpen && !showSuccessDialog}
        onOpenChange={(open) => {
          if (!open && !showSuccessDialog) {
            onClose();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Select Payment Method</h2>
              <div className="space-y-4">
                {paymentOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => !option.disabled && setSelectedMethod(option.id)}
                    className={`p-4 border rounded-lg ${
                      option.disabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : selectedMethod === option.id
                        ? 'border-indigo-500 bg-indigo-50'
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
                        
                        {option.id === 'card' && selectedMethod === 'card' && (
                          <div className="mt-4 space-y-4">
                            {savedCards.length > 0 && (
                              <SavedCardsList
                                cards={savedCards}
                                selectedCardId={selectedCardId || undefined}
                                onSelectCard={setSelectedCardId}
                                showRadioButtons={true}
                              />
                            )}

                            {showNewCardForm ? (
                              <div className="mt-4 p-4 border rounded-lg">
                                <CardElement 
                                  options={{
                                    style: {
                                      base: {
                                        fontSize: '16px',
                                        color: '#424770',
                                        '::placeholder': {
                                          color: '#aab7c4'
                                        }
                                      },
                                      invalid: {
                                        color: '#9e2146'
                                      }
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddNewCard}
                                className="flex items-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Use New Card
                              </Button>
                            )}
                          </div>
                        )}

                        {option.id === 'wire' && selectedMethod === 'wire' && (
                          <div className="mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowBankInfo(!showBankInfo)
                              }}
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
              
              {error && (
                <div className="mt-4 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-medium">Total Amount:</div>
                  <div className="text-lg font-medium">
                    {invoice?.amount ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(invoice.amount) : 'N/A'}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isProcessing || !selectedMethod || 
                      (selectedMethod === 'card' && !selectedCardId && !showNewCardForm) ||
                      (showNewCardForm && !stripe)}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Payment Successful!
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <div>Thank you for your purchase! Your payment has been processed successfully.</div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your order is now being processed</li>
                    <li>• Please allow 2-5 business days for packaging</li>
                    <li>• You'll receive shipping updates via email</li>
                    <li>• Track your order status in the dashboard</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                onClose();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Got it, thanks!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 