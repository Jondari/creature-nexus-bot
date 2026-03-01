/**
 * Local Storage Utilities for Demo Mode
 *
 * Centralized helpers for reading/writing demo data via AsyncStorage.
 * All keys are prefixed with @demo_ to avoid conflicts with production data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '@/models/Card';
import { ExtendedCard } from '@/models/cards-extended';
import { generateCardPack } from '@/utils/cardUtils';
import { generateDefaultPseudo } from '@/utils/pseudoUtils';
import { DEMO_CONFIG } from '@/config/localMode';
import { STANDARD_PACK } from '@/data/boosterPacks';

// Local interface to avoid importing from packInventory (which imports Firebase)
export interface InventoryPack {
  packId: string;
  packName: string;
  packType: string;
  earnedAt: string;
  reason: string;
}

// Local interface to avoid circular import with DeckContext
export interface SavedDeck {
  id: string;
  name: string;
  cards: Array<Card | ExtendedCard>;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

// Storage keys for demo mode
export const DEMO_STORAGE_KEYS = {
  USER: '@demo_user',
  COINS: '@demo_coins',
  CARDS: '@demo_cards',
  PACKS: '@demo_packs',
  DECKS: '@demo_decks',
  ACTIVE_DECK: '@demo_active_deck',
  STORY_PROGRESS: '@demo_story_progress',
  LAST_FREE_PACK: '@demo_last_free_pack',
} as const;

// Demo user profile interface
export interface DemoUserProfile {
  uid: string;
  pseudo: string;
  pseudoChangeUsed: boolean;
  avatarCreature: string | null;
  isAnonymous: true;
  createdAt: string;
}

// Generate a unique demo user ID
export const generateDemoUserId = (): string => {
  return `${DEMO_CONFIG.demoUserUidPrefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Initialize demo user with starter data
export const initializeDemoUser = async (): Promise<DemoUserProfile> => {
  const uid = generateDemoUserId();
  const pseudo = generateDefaultPseudo();

  const profile: DemoUserProfile = {
    uid,
    pseudo,
    pseudoChangeUsed: false,
    avatarCreature: null,
    isAnonymous: true,
    createdAt: new Date().toISOString(),
  };

  // Save profile
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.USER, JSON.stringify(profile));

  // Initialize coins
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.COINS, String(DEMO_CONFIG.startingCoins));

  // Generate starter cards (2 packs worth = 10 cards)
  const starterCards = generateCardPack(10);
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.CARDS, JSON.stringify(starterCards));

  // Initialize starter packs inventory
  const starterPacks: InventoryPack[] = [];
  for (let i = 0; i < DEMO_CONFIG.startingPacks; i++) {
    starterPacks.push({
      packId: STANDARD_PACK.id,
      packName: STANDARD_PACK.name,
      packType: STANDARD_PACK.type,
      earnedAt: new Date().toISOString(),
      reason: 'Welcome Bonus',
    });
  }
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.PACKS, JSON.stringify(starterPacks));

  // Initialize empty decks
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.DECKS, JSON.stringify([]));

  return profile;
};

// Get demo user profile
export const getDemoUser = async (): Promise<DemoUserProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(DEMO_STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// Update demo user profile
export const updateDemoUser = async (updates: Partial<DemoUserProfile>): Promise<void> => {
  const current = await getDemoUser();
  if (current) {
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(DEMO_STORAGE_KEYS.USER, JSON.stringify(updated));
  }
};

// Get demo coins balance
export const getDemoCoins = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(DEMO_STORAGE_KEYS.COINS);
    return data ? parseInt(data, 10) : 0;
  } catch {
    return 0;
  }
};

// Set demo coins balance
export const setDemoCoins = async (amount: number): Promise<void> => {
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.COINS, String(amount));
};

// Add coins to demo balance
export const addDemoCoins = async (amount: number): Promise<number> => {
  const current = await getDemoCoins();
  const newBalance = current + amount;
  await setDemoCoins(newBalance);
  return newBalance;
};

// Spend coins from demo balance (returns false if insufficient)
export const spendDemoCoins = async (amount: number): Promise<boolean> => {
  const current = await getDemoCoins();
  if (current < amount) {
    return false;
  }
  await setDemoCoins(current - amount);
  return true;
};

// Get demo cards collection
export const getDemoCards = async (): Promise<Card[]> => {
  try {
    const data = await AsyncStorage.getItem(DEMO_STORAGE_KEYS.CARDS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Add cards to demo collection (returns only the added cards, matching Firebase contract)
export const addDemoCards = async (newCards: Card[]): Promise<Card[]> => {
  const current = await getDemoCards();
  const updated = [...current, ...newCards];
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.CARDS, JSON.stringify(updated));
  return newCards;
};

// Get demo packs inventory
export const getDemoPacks = async (): Promise<InventoryPack[]> => {
  try {
    const data = await AsyncStorage.getItem(DEMO_STORAGE_KEYS.PACKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Add pack to demo inventory
export const addDemoPack = async (pack: InventoryPack): Promise<void> => {
  const current = await getDemoPacks();
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.PACKS, JSON.stringify([...current, pack]));
};

// Remove pack from demo inventory (only the first match)
export const removeDemoPack = async (packToRemove: InventoryPack): Promise<void> => {
  const current = await getDemoPacks();
  const index = current.findIndex(
    pack => pack.earnedAt === packToRemove.earnedAt && pack.packId === packToRemove.packId
  );
  if (index !== -1) {
    const updated = [...current];
    updated.splice(index, 1);
    await AsyncStorage.setItem(DEMO_STORAGE_KEYS.PACKS, JSON.stringify(updated));
  }
};

// Get demo decks
export const getDemoDecks = async (): Promise<SavedDeck[]> => {
  try {
    const data = await AsyncStorage.getItem(DEMO_STORAGE_KEYS.DECKS);
    if (!data) return [];
    const decks = JSON.parse(data);
    // Restore Date objects
    return decks.map((deck: any) => ({
      ...deck,
      createdAt: new Date(deck.createdAt),
      updatedAt: new Date(deck.updatedAt),
    }));
  } catch {
    return [];
  }
};

// Save demo decks
export const saveDemoDecks = async (decks: SavedDeck[]): Promise<void> => {
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.DECKS, JSON.stringify(decks));
};

// Get active deck ID
export const getDemoActiveDeckId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(DEMO_STORAGE_KEYS.ACTIVE_DECK);
  } catch {
    return null;
  }
};

// Set active deck ID
export const setDemoActiveDeckId = async (deckId: string | null): Promise<void> => {
  if (deckId) {
    await AsyncStorage.setItem(DEMO_STORAGE_KEYS.ACTIVE_DECK, deckId);
  } else {
    await AsyncStorage.removeItem(DEMO_STORAGE_KEYS.ACTIVE_DECK);
  }
};

// Get last free pack timestamp
export const getDemoLastFreePack = async (): Promise<number | null> => {
  try {
    const data = await AsyncStorage.getItem(DEMO_STORAGE_KEYS.LAST_FREE_PACK);
    return data ? parseInt(data, 10) : null;
  } catch {
    return null;
  }
};

// Set last free pack timestamp
export const setDemoLastFreePack = async (timestamp: number): Promise<void> => {
  await AsyncStorage.setItem(DEMO_STORAGE_KEYS.LAST_FREE_PACK, String(timestamp));
};

// Clear all demo data (for reset)
export const clearAllDemoData = async (): Promise<void> => {
  const keys = Object.values(DEMO_STORAGE_KEYS);
  await AsyncStorage.multiRemove(keys);
};
