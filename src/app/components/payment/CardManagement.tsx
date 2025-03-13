'use client';

import { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '@/app/components/ui/button';
import { cardService, SavedCard } from '@/services/cardService';
import { useToast } from '@/hooks/useToast';
import { Loader2, CreditCard, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SavedCardsList } from './SavedCardsList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

export function CardManagement() {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadSavedCards();
  }, []);

  useEffect(() => {
    if (stripe && elements) {
      setIsStripeReady(true);
      console.log('Stripe initialized successfully');
    }
  }, [stripe, elements]);

  useEffect(() => {
    console.log('Stripe Setup:', {
      hasStripe: !!stripe,
      hasElements: !!elements,
      isStripeReady
    });
  }, [stripe, elements, isStripeReady]);

  const loadSavedCards = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }
      
      const cards = await cardService.getSavedCards(user.id);
      setSavedCards(cards);
    } catch (error) {
      console.error('Error loading cards:', error);
      setError('Failed to load saved cards');
      toast({
        title: 'Error',
        description: 'Failed to load saved cards',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowAddCard = () => {
    setIsDialogOpen(true);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      console.log('Requirements check:', {
        hasStripe: !!stripe,
        hasElements: !!elements,
        hasSecret: !!clientSecret
      });
      setError('Payment system not ready');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card input not ready');
      return;
    }

    try {
      setIsLoading(true);
      
      // Attempt card setup immediately after getting element
      const { setupIntent, error: setupError } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: { card: cardElement }
        }
      );

      if (setupError) throw setupError;

      if (setupIntent?.payment_method) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        await cardService.saveCard(setupIntent.payment_method as string, user.id);
        await loadSavedCards();
        
        // Only clear and update UI after successful save
        cardElement.clear();
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Card saved successfully',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to setup payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await cardService.setDefaultCard(cardId, user.id);
      await loadSavedCards();
      
      toast({
        title: 'Success',
        description: 'Default card updated successfully',
      });
    } catch (error) {
      console.error('Error setting default card:', error);
      toast({
        title: 'Error',
        description: 'Failed to update default card',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await cardService.deleteCard(cardId, user.id);
      await loadSavedCards();
      
      toast({
        title: 'Success',
        description: 'Card removed successfully',
      });
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove card',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !savedCards.length) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Payment Methods</h2>
        <Button
          onClick={handleShowAddCard}
          variant="outline"
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          Add New Card
        </Button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <SavedCardsList
          cards={savedCards}
          onSetDefault={handleSetDefault}
          onDelete={handleDeleteCard}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Card</DialogTitle>
            </DialogHeader>
            
            <AddCardForm 
              onSuccess={() => {
                setIsDialogOpen(false);
                loadSavedCards();
              }}
              onError={(error) => {
                setError(error);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Create a new component for the card form
function AddCardForm({ onSuccess, onError }: { 
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const getSetupIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-setup-intent');
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        onError('Failed to initialize payment system');
      }
    };
    getSetupIntent();
  }, [onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    try {
      setIsLoading(true);
      
      const { setupIntent, error: setupError } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          }
        }
      );

      if (setupError) throw setupError;

      if (setupIntent?.payment_method) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        await cardService.saveCard(setupIntent.payment_method as string, user.id);
        onSuccess();
      }
    } catch (error) {
      console.error('Error:', error);
      onError(error instanceof Error ? error.message : 'Failed to setup payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="p-4 border rounded-lg bg-white">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' }
              },
              invalid: { color: '#9e2146' }
            },
            hidePostalCode: true
          }}
          onChange={(e) => setCardComplete(e.complete)}
        />
      </div>
      <Button 
        type="submit"
        disabled={!stripe || !cardComplete || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Add Card'
        )}
      </Button>
    </form>
  );
} 