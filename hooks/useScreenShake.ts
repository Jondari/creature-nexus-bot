import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Provides a screen-level shake effect triggered on damage impacts.
 * Returns an animated style to apply to the outermost game container
 * and a trigger function that accepts an intensity in pixels.
 */
export function useScreenShake() {
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  const triggerShake = useCallback((intensity: number = 4) => {
    const step = 30;

    shakeX.value = withSequence(
      withTiming(intensity, { duration: step }),
      withTiming(-intensity, { duration: step }),
      withTiming(intensity * 0.6, { duration: step }),
      withTiming(-intensity * 0.6, { duration: step }),
      withTiming(intensity * 0.3, { duration: step }),
      withTiming(0, { duration: step }),
    );

    shakeY.value = withSequence(
      withTiming(intensity * 0.5, { duration: step }),
      withTiming(-intensity * 0.3, { duration: step }),
      withTiming(intensity * 0.2, { duration: step }),
      withTiming(0, { duration: step }),
    );
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { translateY: shakeY.value },
    ],
  }));

  return { shakeStyle, triggerShake };
}
