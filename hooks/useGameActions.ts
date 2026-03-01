import { useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { GameAction } from '../types/game';
import { SPELL_CAST_ENGINE_DELAY_MS } from '../constants/animation';

export function useGameActions() {
  const { executeAction, executeAITurn, gameState, gameEngine, triggerSpellCastAnimation } = useGame();

  const playCard = useCallback((cardId: string) => {
    if (!gameState || !gameEngine) return;

    const currentPlayer = gameEngine.getCurrentPlayer();
    const action: GameAction = {
      type: 'PLAY_CARD',
      playerId: currentPlayer.id,
      cardId,
    };

    executeAction(action);
  }, [executeAction, gameState, gameEngine]);

  const castSpell = useCallback((cardId: string, startPosition?: { x: number; y: number }) => {
    if (!gameState || !gameEngine) return;

    const currentPlayer = gameEngine.getCurrentPlayer();
    const spell = currentPlayer.hand.find(c => c.id === cardId);
    
    if (spell) {
      // Trigger animation for both human and AI players
      const defaultPosition = startPosition || { 
        x: currentPlayer.isAI ? 50 : 50,  // AI spells from top area, human from bottom
        y: currentPlayer.isAI ? 100 : 600  // Different starting positions
      };
      triggerSpellCastAnimation(spell, defaultPosition);
      
      // Delay the actual spell execution to allow animation to start
      setTimeout(() => {
        const action: GameAction = {
          type: 'CAST_SPELL',
          playerId: currentPlayer.id,
          cardId,
        };
        executeAction(action);
      }, SPELL_CAST_ENGINE_DELAY_MS); // Start execution after card reaches center
    }
  }, [executeAction, gameState, gameEngine, triggerSpellCastAnimation]);

  const attack = useCallback((attackerCardId: string, attackName: string, targetCardId?: string) => {
    if (!gameState || !gameEngine) return;

    const currentPlayer = gameEngine.getCurrentPlayer();
    const action: GameAction = {
      type: 'ATTACK',
      playerId: currentPlayer.id,
      cardId: attackerCardId,
      attackName,
      targetCardId,
    };

    executeAction(action);
  }, [executeAction, gameState, gameEngine]);

  const retireCard = useCallback((cardId: string) => {
    if (!gameState || !gameEngine) return;

    const currentPlayer = gameEngine.getCurrentPlayer();
    const action: GameAction = {
      type: 'RETIRE_CARD',
      playerId: currentPlayer.id,
      cardId,
    };

    executeAction(action);
  }, [executeAction, gameState, gameEngine]);

  const endTurn = useCallback(() => {
    if (!gameState || !gameEngine) return;

    const currentPlayer = gameEngine.getCurrentPlayer();
    const action: GameAction = {
      type: 'END_TURN',
      playerId: currentPlayer.id,
    };

    executeAction(action);
  }, [executeAction, gameState, gameEngine]);

  const processAITurn = useCallback(() => {
    if (!gameState || !gameEngine) return;

    const currentPlayer = gameEngine.getCurrentPlayer();
    if (currentPlayer.isAI) {
      executeAITurn();
    }
  }, [executeAITurn, gameState, gameEngine]);

  return {
    playCard,
    castSpell,
    attack,
    retireCard,
    endTurn,
    processAITurn,
  };
}
