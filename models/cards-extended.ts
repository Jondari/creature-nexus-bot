/**
 * Extended card type definitions that support both monster and spell cards
 * This extends the existing game types to include new card types for future expansion
 */

import { Element, Rarity, Attack } from '../types/game';

// Extended card types
export type CardType = 'monster' | 'spell';
export type SpellType = 'instant' | 'continuous' | 'enchantment' | 'permanent';
export type TargetType = 'self' | 'enemy' | 'all' | 'field' | 'hand' | 'deck' | 'none';

// Base card interface (common properties)
export interface BaseCard {
  id?: string;          // Generated at runtime
  name: string;
  element: Element;
  rarity: Rarity;
  type: CardType;
}

// Monster card interface (existing card structure)
export interface MonsterCard extends BaseCard {
  type: 'monster';
  hp: number;
  attacks: Attack[];
  maxHp?: number;       // Set during generation
  isMythic?: boolean;   // Set during generation
  lastAttackTurn?: number; // Game state tracking
}

// Spell card interface (new card type)
export interface SpellCard extends BaseCard {
  type: 'spell';
  effect: string;               // Description of what the spell does
  energyCost: number;           // Energy required to cast
  spellType: SpellType;         // Type of spell effect
  duration?: number;            // For continuous spells (turns)
  targetType?: TargetType;      // What the spell targets
  damage?: number;              // For damage-dealing spells
  healing?: number;             // For healing spells
  statModifiers?: {             // For buff/debuff spells
    hpModifier?: number;
    damageModifier?: number;
    energyModifier?: number;
  };
  conditions?: string[];        // Special conditions for activation
  cooldown?: number;            // Turns before can be used again
}

// Union type for all card types
export type ExtendedCard = MonsterCard | SpellCard;

// Card database entry (what's stored in JSON, without runtime fields)
export interface MonsterCardData {
  name: string;
  element: Element;
  rarity: Rarity;
  hp: number;
  attacks: Attack[];
}

export interface SpellCardData {
  name: string;
  element: Element;
  rarity: Rarity;
  effect: string;
  energyCost: number;
  spellType: SpellType;
  duration?: number;
  targetType?: TargetType;
  damage?: number;
  healing?: number;
  statModifiers?: {
    hpModifier?: number;
    damageModifier?: number;
    energyModifier?: number;
  };
  conditions?: string[];
  cooldown?: number;
}

// Union type for database entries
export type CardData = MonsterCardData | SpellCardData;

// Type guards to distinguish between card types
export function isMonsterCard(card: ExtendedCard | CardData | unknown): card is MonsterCard | MonsterCardData {
  return typeof card === 'object' && card !== null && 'hp' in card && 'attacks' in card;
}

export function isSpellCard(card: ExtendedCard | CardData | unknown): card is SpellCard | SpellCardData {
  return typeof card === 'object' && card !== null && 'effect' in card && 'energyCost' in card;
}

export function isMonsterCardData(card: CardData | unknown): card is MonsterCardData {
  return typeof card === 'object' && card !== null && 'hp' in card && 'attacks' in card;
}

export function isSpellCardData(card: CardData | unknown): card is SpellCardData {
  return typeof card === 'object' && card !== null && 'effect' in card && 'energyCost' in card;
}

// Spell effect definitions for common spell types
export interface SpellEffect {
  id: string;
  name: string;
  description: string;
  implementation: (caster: any, target: any, gameState: any) => void;
}

// Common spell effects library
export const COMMON_SPELL_EFFECTS: Record<string, SpellEffect> = {
  DIRECT_DAMAGE: {
    id: 'direct_damage',
    name: 'Direct Damage',
    description: 'Deal damage directly to target',
    implementation: (caster, target, gameState) => {
      // Implementation would go here
    }
  },
  HEAL: {
    id: 'heal',
    name: 'Heal',
    description: 'Restore HP to target',
    implementation: (caster, target, gameState) => {
      // Implementation would go here
    }
  },
  BUFF_DAMAGE: {
    id: 'buff_damage',
    name: 'Damage Buff',
    description: 'Increase target damage for specified duration',
    implementation: (caster, target, gameState) => {
      // Implementation would go here
    }
  },
  DEBUFF_DAMAGE: {
    id: 'debuff_damage',
    name: 'Damage Debuff', 
    description: 'Decrease target damage for specified duration',
    implementation: (caster, target, gameState) => {
      // Implementation would go here
    }
  },
  ENERGY_MANIPULATION: {
    id: 'energy_manipulation',
    name: 'Energy Manipulation',
    description: 'Modify target energy',
    implementation: (caster, target, gameState) => {
      // Implementation would go here
    }
  }
};

// Extended game state to support spells
export interface SpellGameState {
  activeSpells: {
    spellId: string;
    cardId: string;
    caster: string;
    target?: string;
    remainingDuration: number;
    effect: SpellEffect;
  }[];
  spellHistory: {
    cardId: string;
    casterId: string;
    timestamp: number;
    success: boolean;
  }[];
}

// Extended player interface to support spell casting
export interface SpellCapablePlayer {
  id: string;
  name: string;
  deck: ExtendedCard[];
  hand: ExtendedCard[];
  field: MonsterCard[];        // Only monsters can be on field
  spellZone: SpellCard[];      // Active continuous spells
  energy: number;
  points: number;
  isAI: boolean;
  spellCooldowns: Record<string, number>; // Card ID -> turns remaining
}

// Validation functions for extended card system
export class CardValidator {
  static validateMonsterCard(card: MonsterCardData): string[] {
    const errors: string[] = [];
    
    if (!card.name || card.name.trim() === '') {
      errors.push('Monster name is required');
    }
    
    if (!card.hp || card.hp <= 0) {
      errors.push('Monster HP must be positive');
    }
    
    if (!card.attacks || card.attacks.length === 0) {
      errors.push('Monster must have at least one attack');
    }
    
    card.attacks?.forEach((attack, index) => {
      if (!attack.name || attack.name.trim() === '') {
        errors.push(`Attack ${index + 1} name is required`);
      }
      if (attack.damage <= 0) {
        errors.push(`Attack ${index + 1} damage must be positive`);
      }
      if (attack.energy < 0) {
        errors.push(`Attack ${index + 1} energy cost cannot be negative`);
      }
    });
    
    return errors;
  }
  
  static validateSpellCard(card: SpellCardData): string[] {
    const errors: string[] = [];
    
    if (!card.name || card.name.trim() === '') {
      errors.push('Spell name is required');
    }
    
    if (!card.effect || card.effect.trim() === '') {
      errors.push('Spell effect description is required');
    }
    
    if (card.energyCost < 0) {
      errors.push('Spell energy cost cannot be negative');
    }
    
    if (card.duration !== undefined && card.duration <= 0) {
      errors.push('Spell duration must be positive if specified');
    }
    
    if (card.damage !== undefined && card.damage <= 0) {
      errors.push('Spell damage must be positive if specified');
    }
    
    if (card.healing !== undefined && card.healing <= 0) {
      errors.push('Spell healing must be positive if specified');
    }
    
    if (card.cooldown !== undefined && card.cooldown < 0) {
      errors.push('Spell cooldown cannot be negative');
    }
    
    return errors;
  }
  
  static validateCard(card: CardData): string[] {
    const commonErrors: string[] = [];
    
    // Common validation
    const validElements: Element[] = ['fire', 'water', 'air', 'earth', 'all'];
    const validRarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    
    if (!validElements.includes(card.element)) {
      commonErrors.push(`Invalid element: ${card.element}`);
    }
    
    if (!validRarities.includes(card.rarity)) {
      commonErrors.push(`Invalid rarity: ${card.rarity}`);
    }
    
    // Type-specific validation
    let typeErrors: string[] = [];
    if (isMonsterCardData(card)) {
      typeErrors = this.validateMonsterCard(card);
    } else if (isSpellCardData(card)) {
      typeErrors = this.validateSpellCard(card);
    } else {
      commonErrors.push('Unknown card type');
    }
    
    return [...commonErrors, ...typeErrors];
  }
}

// Export legacy types for backwards compatibility
export type { Element, Rarity, Attack } from './game';

// Re-export the original Card type as MonsterCard for backwards compatibility
export type Card = MonsterCard;
