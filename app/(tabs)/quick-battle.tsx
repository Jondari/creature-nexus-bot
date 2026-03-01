import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { GameProvider, useGame } from '@/context/GameContext';
import { GameBoard } from '@/components/GameBoard';
import Colors from '@/constants/Colors';
import { useSceneTrigger } from '@/context/SceneManagerContext';
import { COMMON_ANCHORS } from '@/types/scenes';
import { useAnchorPolling } from '@/hooks/useAnchorPolling';
import { ANCHOR_POLL_LONG_ATTEMPTS } from '@/constants/tutorial';

function QuickBattleContent() {
  const router = useRouter();
  const { gameState } = useGame();
  const sceneTrigger = useSceneTrigger();

  const handleBackPress = () => {
    router.push('/(tabs)/battle');
  };

  // Only show back button when no game is active (deck selection screen)
  const showBackButton = !gameState || gameState.isGameOver;

  useAnchorPolling(
    [COMMON_ANCHORS.FIELD_AREA, COMMON_ANCHORS.END_TURN_BUTTON],
    () => {
      sceneTrigger({ type: 'onEnterScreen', screen: 'battle' });
    },
    { maxAttempts: ANCHOR_POLL_LONG_ATTEMPTS }
  );

  return (
    <View style={styles.container}>
      {/* Back Button - only visible during deck selection */}
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      )}
      
      <GameBoard />
    </View>
  );
}

export default function QuickBattleScreen() {
  return (
    <GameProvider>
      <QuickBattleContent />
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 100,
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.card,
  },
});
