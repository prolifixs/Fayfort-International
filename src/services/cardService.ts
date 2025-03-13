import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface SavedCard {
  id: string;
  stripe_payment_method_id: string;
  card_last4: string;
  card_brand: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

export class CardService {
  private supabase = createClientComponentClient();

  async saveCard(paymentMethodId: string, userId: string) {
    try {
      // First, call our API route to handle Stripe operations
      const response = await fetch('/api/payments/save-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId, userId })
      });

      if (!response.ok) {
        throw new Error('Failed to save card in Stripe');
      }

      const { paymentMethod } = await response.json();
      const card = paymentMethod.card;

      if (!card) throw new Error('Invalid card details');

      // Save to Supabase
      const { data, error } = await this.supabase
        .from('saved_cards')
        .insert({
          user_id: userId,
          stripe_payment_method_id: paymentMethodId,
          card_last4: card.last4,
          card_brand: card.brand,
          card_exp_month: card.exp_month,
          card_exp_year: card.exp_year,
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving card:', error);
      throw error;
    }
  }

  async getSavedCards(userId: string): Promise<SavedCard[]> {
    const { data, error } = await this.supabase
      .from('saved_cards')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data;
  }

  async setDefaultCard(cardId: string, userId: string) {
    const { error } = await this.supabase
      .from('saved_cards')
      .update({ is_default: false })
      .eq('user_id', userId);

    if (error) throw error;

    const { error: updateError } = await this.supabase
      .from('saved_cards')
      .update({ is_default: true })
      .eq('id', cardId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  }

  async deleteCard(cardId: string, userId: string) {
    const { error } = await this.supabase
      .from('saved_cards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const cardService = new CardService(); 