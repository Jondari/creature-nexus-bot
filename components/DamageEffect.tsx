import React, { Suspense, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { playImpactSound } from '../utils/game/soundManager';
import { HITSTOP_DURATION_MS, ATTACK_EFFECT_DURATION_MS } from '../constants/animation';
import { DamageNumber } from './Animation/DamageNumber';
import type { Element } from '../types/game';
import { hasSpritesheet } from './Animation/attackSprites';

const LazyProceduralAttackEffect = React.lazy(() => import('./Animation/SkiaAttackEffect'));

// Lazy-load Skia overlays so the Skia module is only evaluated after CanvasKit is ready
const LazySkiaFlashOverlay = React.lazy(() => import('./Animation/SkiaFlashOverlay'));
const LazySkiaDeathOverlay = React.lazy(() => import('./Animation/SkiaDeathOverlay'));
const LazyAttackEffectSprite = React.lazy(() => import('./Animation/AttackEffectSprite'));

interface DamageEffectProps {
  children: React.ReactNode;
  isActive: boolean;
  duration?: number;
  damage?: number;
  isLethal?: boolean;
  attackElement?: Element;
  onAnimationComplete?: () => void;
}

// Element-based impact colors
const ELEMENT_COLORS: Record<string, string> = {
  fire: '#FF4500',   // OrangeRed
  water: '#1E90FF',  // DodgerBlue
  air: '#E0E0E0',    // LightGray
  earth: '#2E8B57',  // SeaGreen
};

const DEFAULT_IMPACT_COLOR = '#FF0000'; // Red

function getImpactColor(element?: Element): string {
  if (element && element !== 'all') return ELEMENT_COLORS[element] || DEFAULT_IMPACT_COLOR;
  return DEFAULT_IMPACT_COLOR;
}

export function DamageEffect({
  children,
  isActive,
  duration = 1000,
  damage,
  isLethal,
  attackElement,
  onAnimationComplete,
}: DamageEffectProps) {
  const shakeX = useSharedValue(0);
  const flashProgress = useSharedValue(0);
  const particleProgress = useSharedValue(0);

  // Attack effect progress (element-specific visual)
  const attackProgress = useSharedValue(0);

  // Death dissolve shared values (only animate when isLethal)
  const deathScale = useSharedValue(1);
  const deathRotate = useSharedValue(0);
  const deathOpacity = useSharedValue(1);
  const deathProgress = useSharedValue(0);

  // Shake ends at HITSTOP + 7×40ms = ~360ms from start
  const SHAKE_END_MS = HITSTOP_DURATION_MS + 7 * 40;

  useEffect(() => {
    if (!isActive || duration === 0) return;

    // Play impact sound when damage animation starts
    playImpactSound();

    const shakeIntensity = isLethal ? 12 : 8;
    const stepMs = 40;

    // Shake with hitstop
    shakeX.value = withDelay(
      HITSTOP_DURATION_MS,
      withSequence(
        withTiming(shakeIntensity, { duration: stepMs }),
        withTiming(-shakeIntensity, { duration: stepMs }),
        withTiming(shakeIntensity * 0.7, { duration: stepMs }),
        withTiming(-shakeIntensity * 0.7, { duration: stepMs }),
        withTiming(shakeIntensity * 0.4, { duration: stepMs }),
        withTiming(-shakeIntensity * 0.4, { duration: stepMs }),
        withTiming(0, { duration: stepMs }),
      ),
    );

    // Flash pulse
    flashProgress.value = withDelay(
      HITSTOP_DURATION_MS,
      withSequence(
        withTiming(isLethal ? 0.9 : 0.75, { duration: 60, easing: Easing.out(Easing.quad) }),
        withTiming(0.15, { duration: 150 }),
        withTiming(isLethal ? 0.6 : 0.45, { duration: 60 }),
        withTiming(0, { duration: duration * 0.4 }),
      ),
    );

    // Particles burst
    particleProgress.value = withDelay(
      HITSTOP_DURATION_MS,
      withSequence(
        withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 200 }),
      ),
    );

    // Attack effect — element-specific visual burst
    if (attackElement && attackElement !== 'all') {
      attackProgress.value = withDelay(
        HITSTOP_DURATION_MS,
        withTiming(1, { duration: ATTACK_EFFECT_DURATION_MS, easing: Easing.out(Easing.quad) }),
      );
    }

    // Death dissolve — starts after shake, must finish within the duration window
    if (isLethal) {
      const dissolveDuration = Math.max(duration - SHAKE_END_MS, 200);

      deathScale.value = withDelay(
        SHAKE_END_MS,
        withTiming(0.8, { duration: dissolveDuration, easing: Easing.in(Easing.quad) }),
      );
      deathRotate.value = withDelay(
        SHAKE_END_MS,
        withTiming(8, { duration: dissolveDuration, easing: Easing.in(Easing.quad) }),
      );
      deathOpacity.value = withDelay(
        SHAKE_END_MS,
        withTiming(0, { duration: dissolveDuration, easing: Easing.in(Easing.cubic) }),
      );
      deathProgress.value = withDelay(
        SHAKE_END_MS,
        withTiming(1, { duration: dissolveDuration, easing: Easing.out(Easing.quad) }),
      );
    }

    const totalMs = HITSTOP_DURATION_MS + duration * 0.8;
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, totalMs);

    return () => {
      clearTimeout(timer);
      shakeX.value = 0;
      flashProgress.value = 0;
      particleProgress.value = 0;
      attackProgress.value = 0;
      deathScale.value = 1;
      deathRotate.value = 0;
      deathOpacity.value = 1;
      deathProgress.value = 0;
    };
  }, [isActive, duration, isLethal]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const deathStyle = useAnimatedStyle(() => ({
    opacity: deathOpacity.value,
    transform: [
      { scale: deathScale.value },
      { rotate: `${deathRotate.value}deg` },
    ],
  }));

  if (duration === 0) {
    return <>{children}</>;
  }

  const impactColor = getImpactColor(attackElement);
  const particleCount = isLethal ? 12 : 8;

  const canUseSprite = attackElement != null && attackElement !== 'all' && hasSpritesheet(attackElement);

  return (
    <Animated.View style={shakeStyle}>
      <Animated.View style={isLethal ? deathStyle : undefined}>
        {children}
        {isActive && (
          <Suspense fallback={<FallbackFlash color={impactColor} />}>
            <LazySkiaFlashOverlay
              color={impactColor}
              flashProgress={flashProgress}
              particleProgress={particleProgress}
              particleCount={particleCount}
            />
          </Suspense>
        )}
        {isActive && canUseSprite ? (
          <Suspense fallback={<FallbackProcedural progress={attackProgress} attackElement={attackElement} />}>
            <LazyAttackEffectSprite
              progress={attackProgress}
              attackElement={attackElement as Element}
            />
          </Suspense>
        ) : isActive ? (
          <FallbackProcedural progress={attackProgress} attackElement={attackElement} />
        ) : null}
        {isActive && isLethal && (
          <Suspense fallback={null}>
            <LazySkiaDeathOverlay
              progress={deathProgress}
              attackElement={attackElement}
            />
          </Suspense>
        )}
      </Animated.View>
      {isActive && damage != null && (
        <DamageNumber damage={damage} isLethal={isLethal} />
      )}
    </Animated.View>
  );
}

// Simple red flash fallback while Skia chunk loads (should be near-instant)
function FallbackFlash({ color }: { color: string }) {
  return (
    <View
      style={[styles.fallbackOverlay, { backgroundColor: color }]}
      pointerEvents="none"
    />
  );
}

function FallbackProcedural({ progress, attackElement }: { progress: SharedValue<number>; attackElement?: Element }) {
  return (
    <Suspense fallback={null}>
      <LazyProceduralAttackEffect progress={progress} attackElement={attackElement} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  fallbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    opacity: 0.4,
  },
});
