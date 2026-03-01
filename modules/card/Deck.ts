import { Card } from '../../types/game';

export class Deck {
  private cards: Card[];

  constructor(cards: Card[]) {
    this.cards = [...cards];
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(): Card | null {
    return this.cards.pop() || null;
  }

  drawMultiple(count: number): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count && this.cards.length > 0; i++) {
      const card = this.draw();
      if (card) drawn.push(card);
    }
    return drawn;
  }

  peek(): Card | null {
    return this.cards[this.cards.length - 1] || null;
  }

  size(): number {
    return this.cards.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  addCard(card: Card): void {
    this.cards.push(card);
  }

  removeCard(cardId: string): Card | null {
    const index = this.cards.findIndex(card => card.id === cardId);
    if (index !== -1) {
      return this.cards.splice(index, 1)[0];
    }
    return null;
  }

  getCards(): Card[] {
    return [...this.cards];
  }

  reset(cards: Card[]): void {
    this.cards = [...cards];
    this.shuffle();
  }
}