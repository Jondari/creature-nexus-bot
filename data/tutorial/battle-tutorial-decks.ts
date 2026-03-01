import type { Card } from '@/types/game';
import { CardLoader } from '@/utils/game/cardLoader';
import type { MonsterCard } from '@/models/cards-extended';

const monsterCards = CardLoader.getMonsterCards();

const cloneCache = new Map<string, number>();

function cloneCardByName(name: string): Card {
  const source = monsterCards.find(card => card.name === name);
  if (!source) {
    throw new Error(`Tutorial deck card not found: ${name}`);
  }
  const count = (cloneCache.get(name) ?? 0) + 1;
  cloneCache.set(name, count);
  const suffix = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${count}`;
  const monster: MonsterCard = source;
  return {
    id: `${monster.id}_tutorial_${suffix}`,
    name: monster.name,
    element: monster.element,
    rarity: monster.rarity,
    hp: monster.hp,
    maxHp: monster.maxHp ?? monster.hp,
    attacks: monster.attacks.map((attack) => ({ ...attack })),
    isMythic: monster.isMythic,
    lastAttackTurn: undefined,
  };
}

function buildDeck(cardNames: string[]): Card[] {
  return cardNames.map(name => cloneCardByName(name));
}

const playerCardList = [
  'Hydys',
  'Hydys',
  'Flareen',
  'Barkyn',
  'Lumion',
  'Nixor',
  'Miriion',
  'Glacis',
  'Caelel',
  'Ventyn',
  'Mossil',
  'Cryil',
  'Lumen',
  'Radeth',
  'Ventun',
  'Whisun',
  'Flareor',
  'Zarel',
  'Lumoth',
  'Venten'
];

const aiCardList = [
  'Ashion',
  'Ashion',
  'Mossion',
  'Seleth',
  'Pyrrun',
  'Silen',
  'Verdil',
  'Caeloth',
  'Cryel',
  'Solor',
  'Caelun',
  'Dralis',
  'Groan',
  'Miriis',
  'Nixeth',
  'Golrok',
  'Selel',
  'Solen',
  'Zephun',
  'Stonelorn'
];

export const battleTutorialPlayerDeck: Card[] = buildDeck(playerCardList);
export const battleTutorialAIDeck: Card[] = buildDeck(aiCardList);

