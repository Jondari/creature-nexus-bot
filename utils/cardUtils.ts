import { Card, CardRarity, Element, RARITY_WEIGHTS, CARDS_DATABASE, getRandomCardByRarity } from '../models/Card';
import { ExtendedCard } from '../models/cards-extended';

// Generate a random rarity based on weights
export const generateRandomRarity = (): CardRarity => {
  const weights = RARITY_WEIGHTS;
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [rarity, weight] of Object.entries(weights)) {
    if (random < weight) {
      return rarity as CardRarity;
    }
    random -= weight;
  }
  
  return 'common'; // Default fallback
};

// Get a random element from an array
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Generate a single random card
export const generateRandomCard = (): Card => {
  const rarity = generateRandomRarity();
  const baseCard = getRandomCardByRarity(rarity);
  
  return {
    ...baseCard,
    id: `${rarity}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    element: baseCard.element as Element,
    rarity: baseCard.rarity as CardRarity,
    maxHp: baseCard.hp,
    isMythic: rarity === 'mythic',
    // Note: removed createdAt as it's not part of battle engine Card model
  };
};

// Generate a pack of cards (5 cards per pack)
export const generateCardPack = (size = 5): Card[] => {
  const cards: Card[] = [];
  
  for (let i = 0; i < size; i++) {
    cards.push(generateRandomCard());
  }
  
  return cards;
};

// Group cards by ID to count duplicates
export const groupCardsByName = (cards: Card[]): Record<string, Card[]> => {
  return cards.reduce((acc, card) => {
    const key = card.name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(card);
    return acc;
  }, {} as Record<string, Card[]>);
};

// Grouped item used by collection UI: one entry per model with a count
export interface CardGrouped {
  // We do not have a separate "modelId" in the Card type; using "name"
  // as the stable identifier for each card model in the collection.
  modelId: string; // e.g., card name used as model key
  name: string;
  rarity: CardRarity;
  // A representative card instance for rendering visuals (art, element, etc.)
  sample: Card | ExtendedCard;
  count: number;
}

// Group a large list of owned card instances into unique models with counts
export const groupByModel = (cards: Array<Card | ExtendedCard>): CardGrouped[] => {
  const map = new Map<string, CardGrouped>();

  for (const card of cards) {
    const key = card.name; // Use name as the model identifier
    if (!map.has(key)) {
      map.set(key, {
        modelId: key,
        name: card.name,
        rarity: card.rarity,
        sample: card, // Keep first instance for rendering (monster or spell)
        count: 0,
      });
    }
    const entry = map.get(key)!;
    entry.count++;
  }

  return Array.from(map.values());
};

// Filter cards by rarity
export const filterCardsByRarity = (cards: Card[], rarity: CardRarity | 'all'): Card[] => {
  if (rarity === 'all') {
    return cards;
  }
  return cards.filter(card => card.rarity === rarity);
};

// Check if enough time has passed since last pack opening (12 hours)
export const canOpenNewPack = (lastPackOpenedTimestamp: number | null): boolean => {
  if (!lastPackOpenedTimestamp) {
    return true;
  }
  
  const twelveHoursInMs = 12 * 60 * 60 * 1000;
  const timeSinceLastPack = Date.now() - lastPackOpenedTimestamp;
  
  return timeSinceLastPack >= twelveHoursInMs;
};

// Calculate time remaining until next pack can be opened
export const getTimeUntilNextPack = (lastPackOpenedTimestamp: number | null): number => {
  if (!lastPackOpenedTimestamp) {
    return 0;
  }
  
  const twelveHoursInMs = 12 * 60 * 60 * 1000;
  const timeSinceLastPack = Date.now() - lastPackOpenedTimestamp;
  const timeRemaining = twelveHoursInMs - timeSinceLastPack;
  
  return Math.max(0, timeRemaining);
};

// Format milliseconds to a readable time string (HH:MM:SS)
export const formatTimeRemaining = (milliseconds: number): string => {
  if (milliseconds <= 0) {
    return '00:00:00';
  }
  
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};
