import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Card, Element, Rarity } from '@/types/game';
import { ExtendedCard } from '@/models/cards-extended';
import { getRandomCardByRarity } from '@/models/Card';
import { generateRandomCard } from '@/utils/cardUtils';

export type CardRarity = Rarity;

export interface CardRewardRecord {
  cardName: string;
  rarity: CardRarity;
  reason: string;
  awardedAt: string; // ISO timestamp
}

// Award a specific card by name using the monster database as base
export const awardSpecificCard = async (
  userId: string,
  cardName: string,
  reason: string
): Promise<ExtendedCard> => {
  // Use rarity lookup via models/Card database by name
  // Fallback: generate random then override name-based match if available
  // We only have CARDS_DATABASE in models/Card but not exported by name; use a rarity-agnostic approach
  // Here we approximate by generating random until name matches or limit attempts, but
  // better: we import the raw DB json to find by name.
  const monsters = (await import('@/data/monster-cards.json')).default as Array<any>;
  const spells = (await import('@/data/spell-cards.json')).default as Array<any>;
  const monsterBase = monsters.find(c => c.name === cardName);
  const spellBase = spells.find(c => c.name === cardName);

  if (!monsterBase && !spellBase) {
    throw new Error(`Card ${cardName} not found`);
  }

  if (monsterBase) {
    const monsterCard: ExtendedCard = {
      ...monsterBase,
      type: 'monster',
      id: `reward_${cardName}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      element: monsterBase.element as Element,
      rarity: monsterBase.rarity as CardRarity,
      maxHp: monsterBase.hp,
      isMythic: monsterBase.rarity === 'mythic',
    };
    await addCardToCollection(userId, monsterCard, reason);
    return monsterCard;
  }

  // Spell path
  const base = spellBase!;
  const spellCard: ExtendedCard = {
    ...base,
    type: 'spell',
    id: `reward_${cardName}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    element: base.element as Element,
    rarity: base.rarity as CardRarity,
  } as ExtendedCard;
  await addCardToCollection(userId, spellCard, reason);
  return spellCard;
};

// Award a random card, optionally constrained by rarity
export const awardRandomCard = async (
  userId: string,
  reason: string,
  guaranteedRarity?: CardRarity
): Promise<ExtendedCard> => {
  let card: Card;
  if (guaranteedRarity) {
    const base = getRandomCardByRarity(guaranteedRarity);
    card = {
      ...base,
      id: `${guaranteedRarity}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      element: base.element as Element,
      rarity: base.rarity as CardRarity,
      maxHp: base.hp,
      isMythic: guaranteedRarity === 'mythic',
    };
  } else {
    card = generateRandomCard();
  }

  await addCardToCollection(userId, card as ExtendedCard, reason);
  return card as ExtendedCard;
};

// Add a card to the user's collection and append reward history
export const addCardToCollection = async (
  userId: string,
  card: ExtendedCard,
  reason: string
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const record: CardRewardRecord = {
    cardName: card.name,
    rarity: card.rarity as CardRarity,
    reason,
    awardedAt: new Date().toISOString(),
  };

  await updateDoc(userRef, {
    cards: arrayUnion(card),
    cardRewards: arrayUnion(record),
  });
};
