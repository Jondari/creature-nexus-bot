import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useGame } from '@/context/GameContext';
import { useSceneManager } from '@/context/SceneManagerContext';
import type { Card } from '@/types/game';
import { GameBoard } from './GameBoard';
import Colors from '@/constants/Colors';
import LoadingOverlay from './LoadingOverlay';
import { t } from '@/utils/i18n';
import { showConfirmAlert } from '@/utils/alerts';

export interface TutorialGameBoardProps {
  playerDeck: Card[];
  aiDeck: Card[];
  onExit?: () => void;
  /**
   * Called once the game state is initialised and the GameBoard is displayed.
   */
  onReady?: () => void;
}

/**
 * Lightweight wrapper around GameBoard configured for scripted tutorial battles.
 * It bootstraps the game with deterministic decks and hides the deck selection UI
 * present in the standard GameBoard component.
 */
export const TutorialGameBoard: React.FC<TutorialGameBoardProps> = ({
  playerDeck,
  aiDeck,
  onExit,
  onReady,
}) => {
  const { gameState, initializeGame, resetGame, isLoading, error } = useGame();
  const sceneManager = useSceneManager();
  const hasBootstrappedRef = useRef(false);
  const [readyFired, setReadyFired] = useState(false);
  const resetGameRef = useRef(resetGame);
  const sceneManagerRef = useRef(sceneManager);

  useEffect(() => {
    resetGameRef.current = resetGame;
  }, [resetGame]);

  useEffect(() => {
    sceneManagerRef.current = sceneManager;
  }, [sceneManager]);

  const performCleanup = useCallback(() => {
    sceneManagerRef.current.stopCurrentScene();
    resetGameRef.current();
  }, []);

  const confirmExit = useCallback(() => {
    performCleanup();
    onExit?.();
  }, [performCleanup, onExit]);

  const handleExit = useCallback(() => {
    showConfirmAlert(
      t('tutorial.battle.exitTitle'),
      t('tutorial.battle.exitMessage'),
      confirmExit,
      undefined,
      t('tutorial.battle.exitConfirm'),
      t('common.cancel')
    );
  }, [confirmExit]);

  useEffect(() => {
    if (!hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      initializeGame(t('player.you'), playerDeck, aiDeck);
      return;
    }

    // When the gameState becomes null (for example after reset), restart the tutorial encounter
    if (!gameState && playerDeck.length > 0 && aiDeck.length > 0) {
      initializeGame(t('player.you'), playerDeck, aiDeck);
    }
  }, [gameState, playerDeck, aiDeck, initializeGame]);

  useEffect(() => {
    if (gameState && !readyFired) {
      onReady?.();
      setReadyFired(true);
    }
  }, [gameState, readyFired, onReady]);

  useEffect(() => {
    if (!onExit) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [handleExit, onExit]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        performCleanup();
      };
    }, [performCleanup])
  );

  if (isLoading || !gameState) {
    return <LoadingOverlay message={t('tutorial.battle.loading')} />;
  }

  if (error) {
    return <LoadingOverlay message={error} />;
  }

  return (
    <View style={styles.container}>
      <GameBoard />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});

export default TutorialGameBoard;
