/**
 * DeckContextLocal - Local deck management context for demo mode
 *
 * Provides the same interface as DeckContext but without Firebase.
 * All data is stored locally via AsyncStorage.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Card } from '@/models/Card';
import { ExtendedCard } from '@/models/cards-extended';
import {
  getDemoDecks,
  saveDemoDecks,
  getDemoActiveDeckId,
  setDemoActiveDeckId,
} from '@/utils/localStorageUtils';
import { useAuth } from './AuthContextLocal';

export interface SavedDeck {
  id: string;
  name: string;
  cards: Array<Card | ExtendedCard>;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

export interface DeckContextType {
  savedDecks: SavedDeck[];
  activeDeck: SavedDeck | null;
  saveDeck: (cards: Array<Card | ExtendedCard>, name: string, deckId?: string) => Promise<void>;
  deleteDeck: (deckId: string) => Promise<void>;
  setActiveDeck: (deckId: string) => Promise<void>;
  loadDecks: () => Promise<void>;
  syncDecks: () => Promise<void>;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export function DeckProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [activeDeck, setActiveDeckState] = useState<SavedDeck | null>(null);

  // Reload decks when user changes (e.g. sign-out → sign-in)
  useEffect(() => {
    loadDecks();
  }, [user?.uid]);

  const loadDecks = async () => {
    try {
      const decks = await getDemoDecks();
      setSavedDecks(decks);

      // Load active deck
      const activeDeckId = await getDemoActiveDeckId();
      if (activeDeckId) {
        const active = decks.find((d) => d.id === activeDeckId);
        if (active) {
          setActiveDeckState(active);
        } else if (decks.length > 0) {
          // Active deck not found, select first
          setActiveDeckState(decks[0]);
          await setDemoActiveDeckId(decks[0].id);
        }
      } else if (decks.length > 0) {
        // No active deck set, select first
        setActiveDeckState(decks[0]);
        await setDemoActiveDeckId(decks[0].id);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading decks (demo):', error);
      }
    }
  };

  const saveDeck = async (cards: Array<Card | ExtendedCard>, name: string, deckId?: string) => {
    try {
      const now = new Date();
      let updatedDecks: SavedDeck[];

      if (deckId) {
        // Update existing deck
        updatedDecks = savedDecks.map((deck) =>
          deck.id === deckId ? { ...deck, name, cards, updatedAt: now } : deck
        );
      } else {
        // Create new deck
        const newDeck: SavedDeck = {
          id: `deck_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name,
          cards,
          createdAt: now,
          updatedAt: now,
        };
        updatedDecks = [...savedDecks, newDeck];
      }

      // If this is the first deck, make it active
      if (updatedDecks.length === 1 && !activeDeck) {
        const firstDeck = updatedDecks[0];
        updatedDecks = updatedDecks.map((d) => ({ ...d, isActive: d.id === firstDeck.id }));
        setActiveDeckState(firstDeck);
        await setDemoActiveDeckId(firstDeck.id);
      }

      setSavedDecks(updatedDecks);
      await saveDemoDecks(updatedDecks);
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving deck (demo):', error);
      }
      throw error;
    }
  };

  const deleteDeck = async (deckId: string) => {
    try {
      const remaining = savedDecks.filter((d) => d.id !== deckId);

      // If deleting active deck, select another
      if (activeDeck?.id === deckId && remaining.length > 0) {
        const fallback = [...remaining].sort(
          (a, b) =>
            (b.updatedAt?.getTime?.() ?? 0) - (a.updatedAt?.getTime?.() ?? 0) ||
            (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
        )[0];

        const activated = remaining.map((d) => ({ ...d, isActive: d.id === fallback.id }));
        setSavedDecks(activated);
        setActiveDeckState(fallback);
        await saveDemoDecks(activated);
        await setDemoActiveDeckId(fallback.id);
      } else if (activeDeck?.id === deckId) {
        // No decks left
        setSavedDecks(remaining);
        setActiveDeckState(null);
        await saveDemoDecks(remaining);
        await setDemoActiveDeckId(null);
      } else {
        // Deleting non-active deck
        setSavedDecks(remaining);
        await saveDemoDecks(remaining);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error deleting deck (demo):', error);
      }
      throw error;
    }
  };

  const setActiveDeck = async (deckId: string) => {
    try {
      const updatedDecks = savedDecks.map((d) => ({ ...d, isActive: d.id === deckId }));
      const newActive = updatedDecks.find((d) => d.id === deckId);

      if (!newActive) {
        return;
      }

      setSavedDecks(updatedDecks);
      setActiveDeckState(newActive);
      await saveDemoDecks(updatedDecks);
      await setDemoActiveDeckId(deckId);
    } catch (error) {
      if (__DEV__) {
        console.error('Error setting active deck (demo):', error);
      }
      throw error;
    }
  };

  // No-op sync for demo mode (data is always local)
  const syncDecks = async () => {
    // In demo mode, data is always stored locally, no sync needed
  };

  return (
    <DeckContext.Provider
      value={{
        savedDecks,
        activeDeck,
        saveDeck,
        deleteDeck,
        setActiveDeck,
        loadDecks,
        syncDecks,
      }}
    >
      {children}
    </DeckContext.Provider>
  );
}

export function useDecks() {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error('useDecks must be used within a DeckProvider');
  }
  return context;
}
