import { Element, CardRarity, Card } from './Card';

export type BoosterPackType = 
  | 'standard'
  | 'elemental'
  | 'premium'
  | 'event';

export type ElementalPackSubtype = 'fire' | 'water' | 'earth' | 'air' | 'dark' | 'light';
export type PremiumPackSubtype = 'mythic_guaranteed' | 'legendary_guaranteed' | 'alt_art' | 'single_card';

export interface BoosterPackBase {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  type: BoosterPackType;
  
  // Pricing
  nexusCoinPrice: number;
  realMoneyPrice?: number; // In cents (USD), optional for free packs
  
  // Availability
  isAvailable: boolean;
  isPremium: boolean;
  
  // Visual
  imageUrl: string;
  backgroundColor: string;
  
  // Bundle options
  bundleDiscount?: {
    quantity: number; // Buy X packs
    bonus: number;    // Get Y free
  };
}

export interface StandardPack extends BoosterPackBase {
  type: 'standard';
  // Uses default rarity weights
}

export interface ElementalPack extends BoosterPackBase {
  type: 'elemental';
  element: ElementalPackSubtype;
  // Only contains cards of specified element
}

export interface PremiumPack extends BoosterPackBase {
  type: 'premium';
  subtype: PremiumPackSubtype;
  guaranteedRarity?: CardRarity;
  guaranteedCount?: number;
}

export interface EventPack extends BoosterPackBase {
  type: 'event';
  eventName: string;
  startDate: Date;
  endDate: Date;
  exclusiveCards?: string[]; // Card names only available in this pack
}

export type BoosterPack = StandardPack | ElementalPack | PremiumPack | EventPack;

// Pack opening result
export interface PackOpeningResult {
  packId: string;
  packName: string;
  cards: Card[];
  openedAt: Date;
  userId: string;
}

// Currency for purchasing packs
export interface UserCurrency {
  nexusCoins: number;
  lastFreePackOpened?: Date;
}

// Purchase transaction (placeholder for payment integration)
export interface PackPurchaseTransaction {
  id: string;
  userId: string;
  packId: string;
  quantity: number;
  paymentMethod: 'nexus_coins' | 'real_money' | 'free';
  totalCost: number;
  currency: 'nexus_coins' | 'usd';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  
  // Payment integration placeholders
  paymentIntentId?: string; // Stripe/other payment processor
  receiptUrl?: string;
}