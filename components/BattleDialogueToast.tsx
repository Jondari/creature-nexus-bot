import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { Z_INDEX } from '@/constants/animation';

const DISPLAY_MS = 2000;
const EXIT_MS = 250;

interface BattleDialogueToastProps {
  /** Messages produced by BattleDialogueTriggers.evaluate(). */
  messages: string[];
  /** Called when the last message in the batch has finished displaying. */
  onDismiss?: () => void;
}

/**
 * BattleDialogueToast
 *
 * Displays a staggered queue of dialogue messages as floating banners in the
 * top-center of the battle area. Each message slides in from above, holds for
 * 2 s, then fades and slides back out before the next one appears.
 *
 * Receives `messages` from BattleDialogueTriggers.evaluate() – this component
 * holds zero game content; all text comes from the caller.
 */
export function BattleDialogueToast({ messages, onDismiss }: BattleDialogueToastProps) {
  const [currentIndex, setCurrentIndex] = useState(-1);

  const translateY = useSharedValue(-44);
  const opacity = useSharedValue(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // New batch → restart queue from index 0.
  useEffect(() => {
    clearTimer();
    if (messages.length === 0) {
      setCurrentIndex(-1);
      return;
    }
    // Reset animation values before triggering the first index change.
    translateY.value = -44;
    opacity.value = 0;
    setCurrentIndex(0);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Each index change → animate the current message in, wait, then advance.
  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= messages.length) {
      if (currentIndex >= messages.length && messages.length > 0) {
        onDismiss?.();
      }
      return;
    }

    // Slide + fade in.
    translateY.value = -44;
    opacity.value = 0;
    translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });

    // After display time, slide + fade out, then advance to the next message.
    timerRef.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: EXIT_MS });
      translateY.value = withTiming(-44, { duration: EXIT_MS });

      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev: number) => prev + 1);
      }, EXIT_MS + 30);
    }, DISPLAY_MS);

    return clearTimer;
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const message =
    currentIndex >= 0 && currentIndex < messages.length
      ? messages[currentIndex]
      : null;

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, animatedStyle]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    maxWidth: 260,
    backgroundColor: Colors.background.card,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    // Blue left-accent matching the game's primary palette.
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[400],
    zIndex: Z_INDEX.DIALOGUE_TOAST,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 8,
  },
  text: {
    color: Colors.text.primary,
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
