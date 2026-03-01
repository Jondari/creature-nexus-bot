import { Element, AffinityMatrix } from '../../types/game';

export class AffinityCalculator {
  private static affinityMatrix: AffinityMatrix = {
    'fire': {
      'fire': 0,
      'water': -20,
      'air': 20,
      'earth': 0,
      'all': 0,
    },
    'water': {
      'fire': 20,
      'water': 0,
      'air': 0,
      'earth': -20,
      'all': 0,
    },
    'air': {
      'fire': -20,
      'water': 0,
      'air': 0,
      'earth': 20,
      'all': 0,
    },
    'earth': {
      'fire': 0,
      'water': 20,
      'air': -20,
      'earth': 0,
      'all': 0,
    },
    'all': {
      'fire': 0,
      'water': 0,
      'air': 0,
      'earth': 0,
      'all': 0,
    },
  };

  static calculateDamageModifier(attackerElement: Element, defenderElement: Element): number {
    return this.affinityMatrix[attackerElement]?.[defenderElement] || 0;
  }

  static calculateFinalDamage(baseDamage: number, attackerElement: Element, defenderElement: Element): number {
    const modifier = this.calculateDamageModifier(attackerElement, defenderElement);
    return baseDamage + modifier;
  }

  static hasAdvantage(attackerElement: Element, defenderElement: Element): boolean {
    return this.calculateDamageModifier(attackerElement, defenderElement) > 0;
  }

  static hasDisadvantage(attackerElement: Element, defenderElement: Element): boolean {
    return this.calculateDamageModifier(attackerElement, defenderElement) < 0;
  }

  static getAffinityDescription(attackerElement: Element, defenderElement: Element): string {
    const modifier = this.calculateDamageModifier(attackerElement, defenderElement);
    
    if (modifier > 0) {
      return `${attackerElement} has advantage against ${defenderElement} (+${modifier} damage)`;
    } else if (modifier < 0) {
      return `${attackerElement} has disadvantage against ${defenderElement} (${modifier} damage)`;
    } else {
      return `${attackerElement} has no affinity bonus/penalty against ${defenderElement}`;
    }
  }
}