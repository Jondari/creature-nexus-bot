import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import Colors from '@/constants/Colors';

const DEFAULT_MESSAGES = ['GG!', 'Nice!', 'Oops!'];
const BUBBLE_DURATION_MS = 2000;
/** How long the exit animation runs before state is cleared (ms). */
const BUBBLE_EXIT_MS = 150;
const COOLDOWN_MS = 3000;
/** Duration of the picker slide-out before it unmounts (ms). */
const PICKER_EXIT_MS = 120;

interface QuickChatMenuProps {
  /** Forwarded to PlayerAvatar for the creature image. */
  creatureName?: string | null;
  /** Preset messages shown in the picker. Defaults to content-neutral placeholders. */
  presetMessages?: string[];
  /** Called with the selected message so callers can publish the quick_chat event. */
  onChat: (message: string) => void;
  /** Size passed through to PlayerAvatar. Defaults to 'small'. */
  avatarSize?: 'small' | 'medium' | 'large';
}

/**
 * QuickChatMenu
 *
 * Renders the player avatar as a tappable button.
 *
 * Flow:
 *   1. Tap avatar (cooldown not active) → preset message picker slides in.
 *   2. Tap a preset message → picker slides out, speech bubble springs in above.
 *   3. Bubble auto-hides after 2 s with a fade + scale exit.
 *   4. Avatar dims to 45 % opacity for the 3 s cooldown, then fades back to full.
 */
export function QuickChatMenu({
  creatureName = null,
  presetMessages = DEFAULT_MESSAGES,
  onChat,
  avatarSize = 'small',
}: QuickChatMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);

  const lastChatAt = useRef<number>(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Shared animation values ────────────────────────────────────────────────
  const bubbleScale = useSharedValue(0.7);
  const bubbleOpacity = useSharedValue(0);

  const pickerTranslateY = useSharedValue(12);
  const pickerOpacity = useSharedValue(0);

  const avatarScale = useSharedValue(1);
  const avatarOpacity = useSharedValue(1);

  // ── Animated styles ────────────────────────────────────────────────────────
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ scale: bubbleScale.value }],
  }));

  const pickerStyle = useAnimatedStyle(() => ({
    opacity: pickerOpacity.value,
    transform: [{ translateY: pickerTranslateY.value }],
  }));

  const avatarAnimStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
    transform: [{ scale: avatarScale.value }],
  }));

  // ── Animate bubble entrance when bubbleText becomes non-null ───────────────
  useEffect(() => {
    if (bubbleText !== null) {
      bubbleScale.value = 0.7;
      bubbleOpacity.value = 0;
      bubbleScale.value = withSpring(1, { damping: 14, stiffness: 200 });
      bubbleOpacity.value = withTiming(1, { duration: 150 });
    }
  }, [bubbleText]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animate picker entrance when menu becomes visible ─────────────────────
  useEffect(() => {
    if (menuVisible) {
      pickerTranslateY.value = 12;
      pickerOpacity.value = 0;
      pickerTranslateY.value = withSpring(0, { damping: 16, stiffness: 220 });
      pickerOpacity.value = withTiming(1, { duration: 150 });
    }
  }, [menuVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (bubbleTimer.current !== null) clearTimeout(bubbleTimer.current);
      if (pickerExitTimer.current !== null) clearTimeout(pickerExitTimer.current);
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Animate picker out, then unmount after the animation finishes. */
  const hidePicker = useCallback(() => {
    pickerOpacity.value = withTiming(0, { duration: PICKER_EXIT_MS });
    pickerTranslateY.value = withTiming(12, { duration: PICKER_EXIT_MS });
    if (pickerExitTimer.current !== null) clearTimeout(pickerExitTimer.current);
    pickerExitTimer.current = setTimeout(
      () => setMenuVisible(false),
      PICKER_EXIT_MS + 10,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Animate bubble out, then clear the text after the animation finishes. */
  const hideBubble = useCallback(() => {
    bubbleOpacity.value = withTiming(0, { duration: BUBBLE_EXIT_MS });
    bubbleScale.value = withTiming(0.7, { duration: BUBBLE_EXIT_MS }, (finished: boolean) => {
      if (finished) runOnJS(setBubbleText)(null);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleAvatarPress = useCallback(() => {
    const now = Date.now();
    if (now - lastChatAt.current < COOLDOWN_MS) return; // still in cooldown

    if (menuVisible) {
      hidePicker();
    } else {
      setMenuVisible(true);
    }
  }, [menuVisible, hidePicker]);

  const handleSelectMessage = useCallback(
    (message: string) => {
      lastChatAt.current = Date.now();

      // Close picker with exit animation.
      hidePicker();

      // Show bubble (entrance animation fires via useEffect on bubbleText).
      setBubbleText(message);

      // Notify caller so it can publish the quick_chat event.
      onChat(message);

      // Dim avatar during cooldown, then restore opacity.
      avatarOpacity.value = withSequence(
        withTiming(0.45, { duration: 150 }),
        withDelay(COOLDOWN_MS - 300, withTiming(1, { duration: 300 })),
      );

      // Auto-hide bubble: start exit animation slightly before clearing state.
      if (bubbleTimer.current !== null) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(hideBubble, BUBBLE_DURATION_MS - BUBBLE_EXIT_MS);
    },
    [onChat, hidePicker, hideBubble], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handlePressIn = useCallback(() => {
    avatarScale.value = withSpring(0.92, { damping: 18, stiffness: 300 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePressOut = useCallback(() => {
    avatarScale.value = withSpring(1, { damping: 14, stiffness: 220 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── Speech bubble ─────────────────────────────────────────────────── */}
      {bubbleText !== null && (
        <Animated.View style={[styles.bubble, bubbleStyle]}>
          <Text style={styles.bubbleText}>{bubbleText}</Text>
          {/* Downward-pointing tail linking bubble to avatar below. */}
          <View style={styles.bubbleTail} />
        </Animated.View>
      )}

      {/* ── Avatar (tappable) ─────────────────────────────────────────────── */}
      <Animated.View style={avatarAnimStyle}>
        <Pressable
          onPress={handleAvatarPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel="Quick chat"
          accessibilityRole="button"
        >
          <PlayerAvatar creatureName={creatureName} size={avatarSize} />
        </Pressable>
      </Animated.View>

      {/* ── Preset message picker (horizontal pill row) ───────────────────── */}
      {menuVisible && (
        <Animated.View style={[styles.menu, pickerStyle]}>
          {presetMessages.map((msg) => (
            <Pressable
              key={msg}
              style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
              onPress={() => handleSelectMessage(msg)}
            >
              <Text style={styles.pillText}>{msg}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  // Speech bubble
  bubble: {
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary[400],
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
    minWidth: 60,
    maxWidth: 140,
    // Subtle blue glow matching the border accent.
    shadowColor: Colors.primary[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  bubbleText: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  /** Downward-pointing triangle tail. Colour matches the border accent. */
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary[400],
    marginTop: 3,
  },

  // Preset message picker
  menu: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    backgroundColor: Colors.primary[700],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary[400],
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillPressed: {
    backgroundColor: Colors.primary[500],
  },
  pillText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
