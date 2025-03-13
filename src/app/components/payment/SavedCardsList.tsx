'use client';

import { useState } from 'react';
import { SavedCard } from '@/services/cardService';
import { CreditCard } from 'lucide-react';

interface SavedCardsListProps {
  cards: SavedCard[];
  selectedCardId?: string;
  onSelectCard?: (cardId: string) => void;
  showRadioButtons?: boolean;
  onSetDefault?: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
}

export function SavedCardsList({
  cards,
  selectedCardId,
  onSelectCard,
  showRadioButtons = false,
  onSetDefault,
  onDelete
}: SavedCardsListProps) {
  if (!cards.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No saved cards found
      </div>
    );
  }

  const CardItem = ({ card }: { card: SavedCard }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        {showRadioButtons && (
          <input
            type="radio"
            name="card"
            value={card.id}
            checked={selectedCardId === card.id}
            onChange={() => onSelectCard?.(card.id)}
            className="h-4 w-4 text-indigo-600"
          />
        )}
        <CreditCard className="h-6 w-6 text-gray-400" />
        <div>
          <p className="font-medium">
            {card.card_brand.toUpperCase()} •••• {card.card_last4}
          </p>
          <p className="text-sm text-gray-500">
            Expires {card.card_exp_month}/{card.card_exp_year}
            {card.is_default && (
              <span className="ml-2 text-indigo-600">(Default)</span>
            )}
          </p>
        </div>
      </div>
      {(onSetDefault || onDelete) && (
        <div className="flex items-center space-x-2">
          {onSetDefault && !card.is_default && (
            <button
              onClick={() => onSetDefault(card.id)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Set as Default
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(card.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  );
} 