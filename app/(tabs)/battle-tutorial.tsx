import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { GameProvider } from '@/context/GameContext';
import TutorialGameBoard from '@/components/TutorialGameBoard';
import { battleTutorialPlayerDeck, battleTutorialAIDeck } from '@/data/tutorial/battle-tutorial-decks';
import { useSceneManager, useSceneTrigger } from '@/context/SceneManagerContext';
import Colors from '@/constants/Colors';

const BATTLE_SCENE_ID = 'tutorial_battle_basics';

function BattleTutorialContent() {
  const router = useRouter();
  const sceneManager = useSceneManager();
  const sceneTrigger = useSceneTrigger();
  const [boardReady, setBoardReady] = useState(false);
  const triggerSentRef = useRef(false);
  const sceneManagerRef = useRef(sceneManager);

  useEffect(() => {
    sceneManagerRef.current = sceneManager;
  }, [sceneManager]);

  useFocusEffect(
    React.useCallback(() => {
      const manager = sceneManagerRef.current;
      manager.resetSceneHistory(BATTLE_SCENE_ID);

      manager.setFlag('tutorial_battle_completed', false);
      manager.setFlag('card_played', false);
      manager.setFlag('creature_selected', false);
      manager.setFlag('turn_ended', false);
      manager.setFlag('ai_turn_completed', false);
      manager.setProgress('attacks_used', 0);
      manager.setProgress('cards_in_play', 0);

      setBoardReady(false);
      triggerSentRef.current = false;

      return () => {
        manager.stopCurrentScene();
      };
    }, [])
  );

  useEffect(() => {
    if (!boardReady || triggerSentRef.current) {
      return;
    }

    triggerSentRef.current = true;

    const startTutorial = async () => {
      const manager = sceneManagerRef.current;
      const started = await manager.startScene(BATTLE_SCENE_ID);
      if (!started) {
        // Fallback to trigger in case scene conditions prevent auto-start
        sceneTrigger({ type: 'onEnterScreen', screen: 'battle-tutorial' });
      }
    };

    const timeoutId = setTimeout(startTutorial, 200);
    return () => clearTimeout(timeoutId);
  }, [boardReady, sceneTrigger]);

  const handleExit = () => {
    sceneManagerRef.current.stopCurrentScene();
    router.push('/(tabs)/battle');
  };

  return (
    <View style={styles.container}>
      <TutorialGameBoard
        playerDeck={battleTutorialPlayerDeck}
        aiDeck={battleTutorialAIDeck}
        onExit={handleExit}
        onReady={() => setBoardReady(true)}
      />
    </View>
  );
}

export default function BattleTutorialScreen() {
  const [resetKey, setResetKey] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      // Force a full GameProvider remount so the battle context always starts from a clean slate
      setResetKey(prev => prev + 1);
    }, [])
  );

  return (
    <GameProvider key={resetKey}>
      <BattleTutorialContent />
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});
