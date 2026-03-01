import { Card } from '@/models/Card';
import cardsData from '@/data/monster-cards.json';

export type Element = 'fire' | 'water' | 'earth' | 'air' | 'all';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary';
export type DeckConsistency = 'fixed' | 'random' | 'semi-random';

export interface DeckGeneratorConfig {
  element: Element;
  difficulty: Difficulty;
  deckSize: number;
  consistency: DeckConsistency;
  seed?: string; // For consistent random generation
}

export interface DifficultySettings {
  rarityWeights: Record<string, number>;
  minHp: number;
  maxHp: number;
  minDamage: number;
  maxDamage: number;
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    rarityWeights: { common: 0.7, rare: 0.25, epic: 0.05, legendary: 0, mythic: 0 },
    minHp: 60,
    maxHp: 90,
    minDamage: 20,
    maxDamage: 35,
  },
  medium: {
    rarityWeights: { common: 0.4, rare: 0.4, epic: 0.15, legendary: 0.05, mythic: 0 },
    minHp: 70,
    maxHp: 110,
    minDamage: 25,
    maxDamage: 45,
  },
  hard: {
    rarityWeights: { common: 0.2, rare: 0.3, epic: 0.3, legendary: 0.15, mythic: 0.05 },
    minHp: 80,
    maxHp: 130,
    minDamage: 35,
    maxDamage: 60,
  },
  legendary: {
    rarityWeights: { common: 0.1, rare: 0.2, epic: 0.3, legendary: 0.3, mythic: 0.1 },
    minHp: 100,
    maxHp: 150,
    minDamage: 45,
    maxDamage: 80,
  },
};

class StoryDeckGenerator {
  private cards: Card[] = cardsData as Card[];
  private rng: () => number;

  constructor(seed?: string) {
    if (seed) {
      // Simple seeded random number generator for consistency
      let seedValue = this.hashString(seed);
      this.rng = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };
    } else {
      this.rng = Math.random;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  generateDeck(config: DeckGeneratorConfig): Card[] {
    const { element, difficulty, deckSize, consistency, seed } = config;
    
    // Reset RNG with seed if provided
    if (seed && consistency !== 'random') {
      this.rng = this.createSeededRNG(seed);
    }

    let availableCards = this.getCardsForElement(element);
    availableCards = this.filterCardsByDifficulty(availableCards, difficulty);

    const deck: Card[] = [];
    const settings = DIFFICULTY_SETTINGS[difficulty];

    for (let i = 0; i < deckSize; i++) {
      const card = this.selectCardByRarity(availableCards, settings);
      if (card) {
        // Create a new card instance with unique ID for the battle
        const battleCard = {
          ...card,
          id: `${card.name}_${i}_${Date.now()}`,
        };
        deck.push(battleCard);
      }
    }

    return deck;
  }

  private createSeededRNG(seed: string): () => number {
    let seedValue = this.hashString(seed);
    return () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };
  }

  private getCardsForElement(element: Element): Card[] {
    if (element === 'all') {
      return [...this.cards];
    }
    return this.cards.filter(card => card.element === element);
  }

  private filterCardsByDifficulty(cards: Card[], difficulty: Difficulty): Card[] {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    
    return cards.filter(card => {
      const hp = card.hp;
      const damage = card.attacks[0]?.damage || 0;
      
      return hp >= settings.minHp && 
             hp <= settings.maxHp && 
             damage >= settings.minDamage && 
             damage <= settings.maxDamage;
    });
  }

  private selectCardByRarity(cards: Card[], settings: DifficultySettings): Card | null {
    if (cards.length === 0) return null;

    const random = this.rng();
    let cumulative = 0;

    // Group cards by rarity
    const cardsByRarity: Record<string, Card[]> = {};
    cards.forEach(card => {
      if (!cardsByRarity[card.rarity]) {
        cardsByRarity[card.rarity] = [];
      }
      cardsByRarity[card.rarity].push(card);
    });

    // Select rarity based on weights
    for (const [rarity, weight] of Object.entries(settings.rarityWeights)) {
      cumulative += weight;
      if (random <= cumulative && cardsByRarity[rarity]?.length > 0) {
        const rarityCards = cardsByRarity[rarity];
        const randomIndex = Math.floor(this.rng() * rarityCards.length);
        return rarityCards[randomIndex];
      }
    }

    // Fallback: return a random card
    const randomIndex = Math.floor(this.rng() * cards.length);
    return cards[randomIndex];
  }

  // Preset deck configurations for story mode
  static getChapterDeckConfig(chapter: number, battleIndex: number): DeckGeneratorConfig {
    const configs: Record<number, DeckGeneratorConfig> = {
      1: { // Central Nexus World
        element: 'all',
        difficulty: 'easy',
        deckSize: 25,
        consistency: 'semi-random',
        seed: `nexus_${battleIndex}`,
      },
      2: { // Water World
        element: 'water',
        difficulty: 'medium',
        deckSize: 28,
        consistency: 'semi-random',
        seed: `water_${battleIndex}`,
      },
      3: { // Fire World
        element: 'fire',
        difficulty: 'medium',
        deckSize: 28,
        consistency: 'semi-random',
        seed: `fire_${battleIndex}`,
      },
      4: { // Earth World
        element: 'earth',
        difficulty: 'medium',
        deckSize: 28,
        consistency: 'semi-random',
        seed: `earth_${battleIndex}`,
      },
      5: { // Air World
        element: 'air',
        difficulty: 'medium',
        deckSize: 28,
        consistency: 'semi-random',
        seed: `air_${battleIndex}`,
      },
      6: { // Final Nexus
        element: 'all',
        difficulty: 'legendary',
        deckSize: 30,
        consistency: 'fixed',
        seed: `final_nexus_${battleIndex}`,
      },
    };

    return configs[chapter] || configs[1];
  }

  // Generate boss deck with enhanced difficulty
  static generateBossDeck(chapter: number): Card[] {
    const baseConfig = StoryDeckGenerator.getChapterDeckConfig(chapter, 999); // Boss index
    const bossConfig: DeckGeneratorConfig = {
      ...baseConfig,
      difficulty: chapter === 6 ? 'legendary' : 'hard',
      deckSize: baseConfig.deckSize + 5, // Boss has larger deck
      seed: `boss_${chapter}`,
    };

    const generator = new StoryDeckGenerator(bossConfig.seed);
    return generator.generateDeck(bossConfig);
  }
}

export default StoryDeckGenerator;