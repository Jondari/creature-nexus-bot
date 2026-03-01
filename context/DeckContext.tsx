/**
 * DeckContext - Facade that re-exports from Providers
 *
 * This file re-exports DeckProvider, useDecks, and SavedDeck from Providers.tsx,
 * which conditionally loads either Firebase or Local implementation
 * based on EXPO_PUBLIC_DEMO_MODE.
 */

export { DeckProvider, useDecks } from './Providers';
export type { SavedDeck } from './Providers';
export type { DeckContextType } from '@/context/DeckContextLocal';
