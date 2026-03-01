import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { DAMAGE_NUMBER_DURATION_MS } from '../../constants/animation';

interface DamageNumberProps {
  damage: number;
  isLethal?: boolean;
}

export function DamageNumber({ damage, isLethal }: DamageNumberProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Bounce in
    scale.value = withSpring(isLethal ? 1.4 : 1, { damping: 8, stiffness: 300 });

    // Fade in then fade out (single sequence to avoid overwrite)
    opacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withDelay(
        DAMAGE_NUMBER_DURATION_MS * 0.4,
        withTiming(0, { duration: DAMAGE_NUMBER_DURATION_MS * 0.5 }),
      ),
    );

    // Float up
    translateY.value = withDelay(
      200,
      withTiming(-60, { duration: DAMAGE_NUMBER_DURATION_MS - 200, easing: Easing.out(Easing.quad) }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        styles.text,
        isLethal && styles.lethalText,
        animatedStyle,
      ]}
    >
      -{damage}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    color: '#FF4444',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 11,
    pointerEvents: 'none',
  },
  lethalText: {
    fontSize: 32,
    color: '#FF0000',
    textShadowColor: '#FFD700',
    textShadowRadius: 6,
  },
});
