import cardsData from '../data/monster-cards.json';

// Re-export battle engine types and interfaces
export type { Element, Rarity, Attack, Card } from '../types/game';

// For backwards compatibility, also export as CardRarity
export type CardRarity = import('../types/game').Rarity;

export const RARITY_WEIGHTS = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mythic: 1
};

export const RARITY_COLORS = {
  common: '#8e919f',
  rare: '#3e7cc9',
  epic: '#9855d4',
  legendary: '#df8c2b',
  mythic: '#e84b55'
};

// Card database from battle engine
export const CARDS_DATABASE = cardsData;

// Helper functions to get cards by rarity
export const getCardsByRarity = (rarity: CardRarity) => {
  return CARDS_DATABASE.filter(card => card.rarity === rarity);
};

export const getRandomCardByRarity = (rarity: CardRarity) => {
  const cards = getCardsByRarity(rarity);
  return cards[Math.floor(Math.random() * cards.length)];
};