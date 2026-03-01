import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import Colors from '@/constants/Colors';

const DEFAULT_MESSAGES = ['GG!', 'Nice!', 'Oops!'];
const BUBBLE_DURATION_MS = 2000;
const COOLDOWN_MS = 3000;

interface QuickChatMenuProps {
  /** Forwarded to PlayerAvatar for the creature image. */
  creatureName?: string | null;
  /** Preset messages shown in the picker. Defaults to ['GG!', 'Nice!', 'Oops!']. */
  presetMessages?: string[];
  /** Called with the selected message once the cooldown check passes. */
  onChat: (message: string) => void;
  /** Size passed through to PlayerAvatar. Defaults to 'small'. */
  avatarSize?: 'small' | 'medium' | 'large';
}

/**
 * QuickChatMenu
 *
 * Renders the player avatar as a tappable button. Tapping opens a small preset
 * message picker. Selecting a message:
 *   1. Hides the picker.
 *   2. Shows a speech bubble above the avatar for 2 seconds.
 *   3. Calls onChat(message) so callers can publish the event.
 *   4. Starts a 3-second cooldown; additional taps are ignored until it expires.
 */
export function QuickChatMenu({
  creatureName = null,
  presetMessages = DEFAULT_MESSAGES,
  onChat,
  avatarSize = 'small',
}: QuickChatMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);

  /** Timestamp (ms) of the last sent chat message – used for cooldown. */
  const lastChatAt = useRef<number>(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up the auto-hide timer on unmount.
  useEffect(() => {
    return () => {
      if (bubbleTimer.current !== null) clearTimeout(bubbleTimer.current);
    };
  }, []);

  const handleAvatarPress = useCallback(() => {
    const now = Date.now();
    if (now - lastChatAt.current < COOLDOWN_MS) return; // Cooldown active – ignore.
    setMenuVisible(prev => !prev);
  }, []);

  const handleSelectMessage = useCallback(
    (message: string) => {
      lastChatAt.current = Date.now();
      setMenuVisible(false);
      setBubbleText(message);
      onChat(message);

      // Auto-hide the bubble after BUBBLE_DURATION_MS.
      if (bubbleTimer.current !== null) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubbleText(null), BUBBLE_DURATION_MS);
    },
    [onChat],
  );

  return (
    <View style={styles.container}>
      {/* Speech bubble – appears above the avatar for 2 s after a message is sent */}
      {bubbleText !== null && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{bubbleText}</Text>
          {/* Downward-pointing tail connecting the bubble to the avatar */}
          <View style={styles.bubbleTail} />
        </View>
      )}

      {/* Avatar – tap to open the quick-chat picker */}
      <TouchableOpacity
        onPress={handleAvatarPress}
        activeOpacity={0.75}
        accessibilityLabel="Quick chat"
        accessibilityRole="button"
      >
        <PlayerAvatar creatureName={creatureName} size={avatarSize} />
      </TouchableOpacity>

      {/* Preset message picker – shown while menuVisible */}
      {menuVisible && (
        <View style={styles.menu}>
          {presetMessages.map(msg => (
            <TouchableOpacity
              key={msg}
              style={styles.menuItem}
              onPress={() => handleSelectMessage(msg)}
              activeOpacity={0.8}
            >
              <Text style={styles.menuItemText}>{msg}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  // ── Speech bubble ──────────────────────────────────────────────────────────
  bubble: {
    backgroundColor: Colors.background.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.neutral?.[300] ?? '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
    maxWidth: 120,
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  bubbleText: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  /** Downward triangle tail below the bubble text area. */
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.background.card,
    marginTop: 2,
    alignSelf: 'center',
  },

  // ── Preset message picker ─────────────────────────────────────────────────
  menu: {
    marginTop: 4,
    backgroundColor: Colors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral?.[300] ?? '#ccc',
    overflow: 'hidden',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral?.[200] ?? '#eee',
  },
  menuItemText: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
