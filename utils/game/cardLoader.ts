import { Card, Element, Rarity } from '../../types/game';
import { ExtendedCard, MonsterCard, SpellCard, isMonsterCardData, isSpellCardData } from '../../models/cards-extended';
import cardData from '../../data/monster-cards.json';
import spellData from '../../data/spell-cards.json';

export class CardLoader {
  private static cards: ExtendedCard[] = [];

  static loadCards(): ExtendedCard[] {
    if (this.cards.length === 0) {
      // Load monster cards (monster-cards.json)
      const monsters: MonsterCard[] = cardData.map((card, index) => ({
        ...card,
        type: 'monster' as const,
        element: card.element as Element,
        rarity: card.rarity as Rarity,
        id: card.name.toLowerCase().replace(/\s+/g, '_') + '_monster_' + index,
        maxHp: card.hp,
        isMythic: card.rarity === 'mythic',
      }));

      // Load spell cards (spell-cards.json)
      const spells: SpellCard[] = spellData.map((spell, index) => ({
        ...spell,
        type: 'spell' as const,
        element: spell.element as Element,
        rarity: spell.rarity as Rarity,
        id: spell.name.toLowerCase().replace(/\s+/g, '_') + '_spell_' + index,
      }));

      this.cards = [...monsters, ...spells];
    }
    return [...this.cards];
  }

  static getCardById(id: string): ExtendedCard | undefined {
    const cards = this.loadCards();
    return cards.find(card => card.id === id);
  }

  static getCardsByElement(element: string): ExtendedCard[] {
    const cards = this.loadCards();
    return cards.filter(card => card.element === element);
  }

  static getCardsByRarity(rarity: string): ExtendedCard[] {
    const cards = this.loadCards();
    return cards.filter(card => card.rarity === rarity);
  }

  static getMonsterCards(): MonsterCard[] {
    const cards = this.loadCards();
    return cards.filter(card => card.type === 'monster') as MonsterCard[];
  }

  static getSpellCards(): SpellCard[] {
    const cards = this.loadCards();
    return cards.filter(card => card.type === 'spell') as SpellCard[];
  }

  static createRandomDeck(size: number = 25): ExtendedCard[] {
    const allCards = this.loadCards();
    const deck: ExtendedCard[] = [];
    
    for (let i = 0; i < size; i++) {
      const randomIndex = Math.floor(Math.random() * allCards.length);
      const selectedCard = { ...allCards[randomIndex] };
      selectedCard.id = selectedCard.id + '_deck_' + i;
      deck.push(selectedCard);
    }
    
    return deck;
  }

  static createBalancedDeck(size: number = 25): ExtendedCard[] {
    const allCards = this.loadCards();
    const deck: ExtendedCard[] = [];
    
    const commonCards = allCards.filter(c => c.rarity === 'common');
    const rareCards = allCards.filter(c => c.rarity === 'rare');
    const epicCards = allCards.filter(c => c.rarity === 'epic');
    const legendaryCards = allCards.filter(c => c.rarity === 'legendary');
    const mythicCards = allCards.filter(c => c.rarity === 'mythic');
    
    const commonCount = Math.floor(size * 0.5);
    const rareCount = Math.floor(size * 0.25);
    const epicCount = Math.floor(size * 0.15);
    const legendaryCount = Math.floor(size * 0.08);
    const mythicCount = size - commonCount - rareCount - epicCount - legendaryCount;
    
    this.addRandomCards(deck, commonCards, commonCount);
    this.addRandomCards(deck, rareCards, rareCount);
    this.addRandomCards(deck, epicCards, epicCount);
    this.addRandomCards(deck, legendaryCards, legendaryCount);
    this.addRandomCards(deck, mythicCards, mythicCount);
    
    return deck;
  }

  private static addRandomCards(deck: ExtendedCard[], sourceCards: ExtendedCard[], count: number): void {
    for (let i = 0; i < count && sourceCards.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * sourceCards.length);
      const selectedCard = { ...sourceCards[randomIndex] };
      selectedCard.id = selectedCard.id + '_deck_' + deck.length;
      deck.push(selectedCard);
    }
  }
}