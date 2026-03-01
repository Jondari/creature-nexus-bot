import React from 'react';
import { Platform } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { Element } from '../../types/game';
import SkiaSpritesheetAttack from './SkiaSpritesheetAttack';
import WebSpritesheetAttack from './WebSpritesheetAttack';
import { hasSpritesheet } from './attackSprites';

interface Props {
  progress: SharedValue<number>;
  attackElement?: Element;
}

export default function AttackEffectSprite({ progress, attackElement }: Props) {
  if (!hasSpritesheet(attackElement)) {
    return null;
  }

  if (Platform.OS === 'web') {
    return <WebSpritesheetAttack progress={progress} attackElement={attackElement} />;
  }

  return <SkiaSpritesheetAttack progress={progress} attackElement={attackElement} />;
}
