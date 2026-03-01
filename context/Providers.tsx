/**
 * Providers - Conditional provider loader
 *
 * Uses require() to avoid static imports that would load Firebase in demo mode.
 * This file exports the correct providers based on EXPO_PUBLIC_DEMO_MODE.
 */

import type { ComponentType, ReactNode } from 'react';
import { isDemoMode } from '@/config/localMode';
import type { AuthContextType } from '@/context/AuthContextLocal';
import type { DeckContextType } from '@/context/DeckContextLocal';
import type { StoryModeContextType } from '@/context/StoryModeContextLocal';

// Use require() for conditional loading to avoid static import side effects
let AuthProvider: ComponentType<{ children: ReactNode }>;
let useAuth: () => AuthContextType;
let DeckProvider: ComponentType<{ children: ReactNode }>;
let useDecks: () => DeckContextType;
let StoryModeProvider: ComponentType<{ children: ReactNode }>;
let useStoryMode: () => StoryModeContextType;

if (isDemoMode) {
  // Demo mode: load local providers (no Firebase)
  const AuthLocal = require('@/context/AuthContextLocal');
  const DeckLocal = require('@/context/DeckContextLocal');
  const StoryLocal = require('@/context/StoryModeContextLocal');

  AuthProvider = AuthLocal.AuthProvider;
  useAuth = AuthLocal.useAuth;
  DeckProvider = DeckLocal.DeckProvider;
  useDecks = DeckLocal.useDecks;
  StoryModeProvider = StoryLocal.StoryModeProvider;
  useStoryMode = StoryLocal.useStoryMode;
} else {
  // Production mode: load Firebase providers
  const AuthFirebase = require('@/context/AuthContextFirebase');
  const DeckFirebase = require('@/context/DeckContextFirebase');
  const StoryFirebase = require('@/context/StoryModeContextFirebase');

  AuthProvider = AuthFirebase.AuthProvider;
  useAuth = AuthFirebase.useAuth;
  DeckProvider = DeckFirebase.DeckProvider;
  useDecks = DeckFirebase.useDecks;
  StoryModeProvider = StoryFirebase.StoryModeProvider;
  useStoryMode = StoryFirebase.useStoryMode;
}

// Re-export SavedDeck interface from local (doesn't depend on Firebase)
export type { SavedDeck } from '@/context/DeckContextLocal';

// Re-export InventoryPack interface from local (doesn't depend on Firebase)
export type { InventoryPack } from '@/utils/localStorageUtils';

// Re-export getAIDeckForBattle from local (same implementation, doesn't depend on Firebase)
export { getAIDeckForBattle } from '@/context/StoryModeContextLocal';

export { AuthProvider, useAuth, DeckProvider, useDecks, StoryModeProvider, useStoryMode };
export type { AuthContextType } from '@/context/AuthContextLocal';
export type { DeckContextType } from '@/context/DeckContextLocal';
export type { StoryModeContextType } from '@/context/StoryModeContextLocal';
