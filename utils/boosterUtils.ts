import { Card, CardRarity, Element, getRandomCardByRarity, getCardsByRarity } from '../models/Card';
import { BoosterPack, ElementalPack, PremiumPack } from '../models/BoosterPack';
import { generateCardPack, generateRandomCard, generateRandomRarity } from './cardUtils';

// Generate cards for different pack types using existing card generation
export const generatePackCards = (pack: BoosterPack): Card[] => {
  switch (pack.type) {
    case 'standard':
      // Use existing generateCardPack function
      return generateCardPack(pack.cardCount);
    
    case 'elemental':
      return generateElementalPack(pack as ElementalPack);
    
    case 'premium':
      return generatePremiumPack(pack as PremiumPack);
    
    case 'event':
      // For now, treat event packs like standard packs
      return generateCardPack(pack.cardCount);
    
    default:
      return generateCardPack(5);
  }
};

// Elemental pack generation - filter existing cards by element
const generateElementalPack = (pack: ElementalPack): Card[] => {
  const cards: Card[] = [];
  const targetElement = mapElementalSubtype(pack.element);
  
  for (let i = 0; i < pack.cardCount; i++) {
    // Use existing rarity weights for each card
    const rarity = generateRandomRarity();
    
    // Get cards of this rarity that match the target element
    const cardsOfRarity = getCardsByRarity(rarity);
    const elementalCards = cardsOfRarity.filter(card => card.element === targetElement);
    
    if (elementalCards.length > 0) {
      // Pick random card from filtered list
      const baseCard = elementalCards[Math.floor(Math.random() * elementalCards.length)];
      
      // Create card instance using existing pattern
      const card: Card = {
        ...baseCard,
        id: `${rarity}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        element: baseCard.element as Element,
        rarity: baseCard.rarity as CardRarity,
        maxHp: baseCard.hp,
        isMythic: rarity === 'mythic',
      };
      
      cards.push(card);
    } else {
      // Fallback: if no cards of this element/rarity exist, use regular random card
      cards.push(generateRandomCard());
    }
  }
  
  return cards;
};

// Premium pack generation with guaranteed rarity + normal rarity weights
const generatePremiumPack = (pack: PremiumPack): Card[] => {
  const cards: Card[] = [];
  
  // Step 1: Generate guaranteed rarity card(s) first
  if (pack.guaranteedRarity && pack.guaranteedCount) {
    for (let i = 0; i < pack.guaranteedCount; i++) {
      const guaranteedCard = generateGuaranteedCard(pack.guaranteedRarity);
      cards.push(guaranteedCard);
    }
  }
  
  // Step 2: Fill remaining slots using normal rarity drop rates
  const remainingSlots = pack.cardCount - cards.length;
  for (let i = 0; i < remainingSlots; i++) {
    // Use existing generateRandomCard which applies rarity weights
    cards.push(generateRandomCard());
  }
  
  // Step 3: Shuffle to randomize card order (so guaranteed isn't always first)
  return shuffleArray(cards);
};

// Generate a card with specific guaranteed rarity (reuses existing system)
const generateGuaranteedCard = (rarity: CardRarity): Card => {
  // Use existing getRandomCardByRarity function
  const baseCard = getRandomCardByRarity(rarity);
  
  // Use existing card creation pattern
  return {
    ...baseCard,
    id: `${rarity}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    element: baseCard.element as Element,
    rarity: baseCard.rarity as CardRarity,
    maxHp: baseCard.hp,
    isMythic: rarity === 'mythic',
  };
};

// Map elemental pack subtypes to existing card elements
const mapElementalSubtype = (subtype: string): Element => {
  const mapping: Record<string, Element> = {
    fire: 'fire',
    water: 'water', 
    earth: 'earth',
    air: 'air'
  };
  
  return mapping[subtype] || 'fire'; // Default to fire if unknown
};

// Utility function to shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Single card pack generation (for events/rewards)
export const generateSingleCard = (guaranteedRarity?: CardRarity): Card => {
  if (guaranteedRarity) {
    return generateGuaranteedCard(guaranteedRarity);
  } else {
    // Use existing random generation with rarity weights
    return generateRandomCard();
  }
};