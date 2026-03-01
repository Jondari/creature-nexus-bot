import type { Element } from '../../types/game';

export const SPRITESHEET_COLUMNS = 5;

export const ATTACK_SPRITESHEETS: Partial<Record<Exclude<Element, 'all'>, ReturnType<typeof require>>> = {
  fire: require('../../assets/images/attack/Fire.png'),
  water: require('../../assets/images/attack/Water.png'),
  air: require('../../assets/images/attack/Wind.png'),
  earth: require('../../assets/images/attack/Earth.png'),
};

export function hasSpritesheet(element?: Element | null): element is Exclude<Element, 'all'> {
  return !!element && element !== 'all' && ATTACK_SPRITESHEETS[element] != null;
}
