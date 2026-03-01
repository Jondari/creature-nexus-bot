import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { DiscordIcon } from '@/components/DiscordIcon';
import { isDemoMode } from '@/config/localMode';
import { t } from '../../utils/i18n';
import { GAME_OVER_ANIM_DURATION_MS, Z_INDEX } from '../../constants/animation';
import Colors from '../../constants/Colors';

const DISCORD_INVITE_URL = process.env.EXPO_PUBLIC_DISCORD_INVITE_URL;

interface GameOverAnimationProps {
  isVictory: boolean;
  winnerName: string;
  winReason: string;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export function GameOverAnimation({
  isVictory,
  winnerName,
  winReason,
  onPlayAgain,
  onReturnToMenu,
}: GameOverAnimationProps) {
  const titleScale = useSharedValue(0);
  const subtextOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);

  useEffect(() => {
    // Title: bounce in
    titleScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 180 }),
    );

    // Subtext: fade in after 300ms
    subtextOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    // Buttons: fade in + slide up after 600ms
    buttonsOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    buttonsTranslateY.value = withDelay(600, withTiming(0, { duration: 400 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const subtextStyle = useAnimatedStyle(() => ({
    opacity: subtextOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const handleJoinDiscord = () => {
    if (!DISCORD_INVITE_URL) return;
    Linking.openURL(DISCORD_INVITE_URL);
  };

  return (
    <View style={styles.centered}>
      <Animated.View style={titleStyle}>
        <Text style={[styles.gameOver, isVictory ? styles.victoryText : styles.defeatText]}>
          {isVictory ? t('game_over.victory') : t('game_over.defeat')}
        </Text>
      </Animated.View>

      <Animated.View style={subtextStyle}>
        <Text style={styles.winner}>{t('game_over.winner')}: {winnerName}</Text>
        {winReason ? (
          <Text style={styles.winReason}>{winReason}</Text>
        ) : null}
      </Animated.View>

      <Animated.View style={buttonsStyle}>
        <View style={styles.gameOverButtons}>
          <TouchableOpacity style={styles.gameOverButton} onPress={onPlayAgain}>
            <Text style={styles.gameOverButtonText}>{t('game.playAgain')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameOverButton, styles.gameOverButtonSecondary]}
            onPress={onReturnToMenu}
          >
            <Text style={[styles.gameOverButtonText, styles.gameOverButtonTextSecondary]}>
              {t('game.returnToMenu')}
            </Text>
          </TouchableOpacity>
        </View>

        {isDemoMode && DISCORD_INVITE_URL ? (
          <View style={styles.demoCtaContainer}>
            <Text style={styles.demoCtaText}>{t('game_over.demoCta.title')}</Text>
            <TouchableOpacity
              style={[styles.gameOverButton, styles.discordButton]}
              onPress={handleJoinDiscord}
            >
              <View style={styles.discordButtonContent}>
                <DiscordIcon size={20} color={Colors.text.primary} />
                <Text style={styles.gameOverButtonText}>
                  {t('game_over.demoCta.button')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  gameOver: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  victoryText: {
    color: '#4CAF50',
  },
  defeatText: {
    color: '#F44336',
  },
  winner: {
    fontSize: 18,
    textAlign: 'center',
    color: Colors.text.secondary,
  },
  winReason: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.text.secondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  gameOverButtons: {
    marginTop: 30,
    gap: 15,
  },
  gameOverButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  gameOverButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary[600],
  },
  gameOverButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameOverButtonTextSecondary: {
    color: Colors.primary[600],
  },
  demoCtaContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  demoCtaText: {
    color: Colors.text.secondary,
    textAlign: 'center',
    fontSize: 18,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  discordButton: {
    backgroundColor: Colors.accent[600],
  },
  discordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
