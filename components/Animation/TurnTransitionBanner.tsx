import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { t } from '../../utils/i18n';
import { TURN_TRANSITION_DURATION_MS, Z_INDEX } from '../../constants/animation';

interface TurnTransitionBannerProps {
  isPlayerTurn: boolean;
  visible: boolean;
  onComplete: () => void;
}

export function TurnTransitionBanner({ isPlayerTurn, visible, onComplete }: TurnTransitionBannerProps) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Fade in, hold, fade out
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1200, withTiming(0, { duration: 300 })),
      );
      // Slide in, hold, slide out
      translateY.value = withSequence(
        withSpring(0, { damping: 12, stiffness: 180 }),
        withDelay(1200, withTiming(-80, { duration: 300 })),
      );

      const timer = setTimeout(() => {
        onComplete();
      }, TURN_TRANSITION_DURATION_MS);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -80;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const backgroundColor = isPlayerTurn ? '#2E7D32' : '#C62828';
  const label = isPlayerTurn ? t('game.yourTurn') : t('game.aiTurn');

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor }, animatedStyle]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: Z_INDEX.TURN_BANNER,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
