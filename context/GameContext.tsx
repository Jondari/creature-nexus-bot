import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { GameState, Player, Card, GameAction, ActionLogEntry, DamageAnimation, AIVisualState, AIStatus, Element } from '../types/game';
import { GameEngine } from '../modules/game';
import { t } from '../utils/i18n';
import { PlayerUtils } from '../modules/player';
import { AIEngine } from '../modules/ai';
import { initializeSounds } from '../utils/game/soundManager';
import { SPELL_CAST_ENGINE_DELAY_MS, KILL_ANIM_MS, NON_KILL_ANIM_MS, ENERGY_WAVE_DURATION_MS, TURN_TRANSITION_DURATION_MS } from '../constants/animation';
import { AnimationQueue } from '../utils/game/animationQueue';
import { useSettings } from './SettingsContext';

interface GameContextState {
  gameEngine: GameEngine | null;
  gameState: GameState | null;
  actionLog: ActionLogEntry[];
  damageAnimations: DamageAnimation[];
  aiVisualState: AIVisualState;
  energyWaveAnimation: { show: boolean; amount: number } | null;
  turnBannerAnimation: { show: boolean; isPlayerTurn: boolean } | null;
  spellCastAnimation: { show: boolean; spell: Card; startPosition: { x: number; y: number } } | null;
  isLoading: boolean;
  error: string | null;
}

interface GameContextActions {
  initializeGame: (playerName: string, playerDeck: Card[], aiDeck: Card[]) => void;
  executeAction: (action: GameAction) => void;
  executeAITurn: () => void;
  resetGame: () => void;
  triggerDamageAnimation: (cardId: string, duration?: number, extra?: Pick<DamageAnimation, 'damage' | 'isLethal' | 'attackElement'>) => void;
  clearDamageAnimation: (cardId: string) => void;
  triggerEnergyWaveAnimation: (amount: number) => void;
  clearEnergyWaveAnimation: () => void;
  triggerSpellCastAnimation: (spell: Card, startPosition: { x: number; y: number }) => void;
  clearSpellCastAnimation: () => void;
  setAIStatus: (status: AIStatus, message?: string) => void;
  setAIHighlight: (cardId?: string, targetCardId?: string) => void;
  clearAIVisuals: () => void;
}

type GameContextType = GameContextState & GameContextActions;

const GameContext = createContext<GameContextType | undefined>(undefined);

type GameAction_Context = 
  | { type: 'INITIALIZE_GAME'; payload: { gameEngine: GameEngine; gameState: GameState } }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'ADD_ACTION_LOG'; payload: ActionLogEntry }
  | { type: 'ADD_DAMAGE_ANIMATION'; payload: DamageAnimation }
  | { type: 'CLEAR_DAMAGE_ANIMATION'; payload: string }
  | { type: 'TRIGGER_ENERGY_WAVE_ANIMATION'; payload: number }
  | { type: 'CLEAR_ENERGY_WAVE_ANIMATION' }
  | { type: 'TRIGGER_TURN_BANNER'; payload: boolean }
  | { type: 'CLEAR_TURN_BANNER' }
  | { type: 'TRIGGER_SPELL_CAST_ANIMATION'; payload: { spell: Card; startPosition: { x: number; y: number } } }
  | { type: 'CLEAR_SPELL_CAST_ANIMATION' }
  | { type: 'SET_AI_STATUS'; payload: { status: AIStatus; message?: string } }
  | { type: 'SET_AI_HIGHLIGHT'; payload: { cardId?: string; targetCardId?: string } }
  | { type: 'CLEAR_AI_VISUALS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_GAME' };

const initialState: GameContextState = {
  gameEngine: null,
  gameState: null,
  actionLog: [],
  damageAnimations: [],
  aiVisualState: {
    status: 'idle',
    isActive: false,
  },
  energyWaveAnimation: null,
  turnBannerAnimation: null,
  spellCastAnimation: null,
  isLoading: false,
  error: null,
};

function gameReducer(state: GameContextState, action: GameAction_Context): GameContextState {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return {
        ...state,
        gameEngine: action.payload.gameEngine,
        gameState: action.payload.gameState,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_GAME_STATE':
      return {
        ...state,
        gameState: action.payload,
      };
    case 'ADD_ACTION_LOG':
      return {
        ...state,
        actionLog: [...state.actionLog, action.payload],
      };
    case 'ADD_DAMAGE_ANIMATION':
      return {
        ...state,
        damageAnimations: [...state.damageAnimations, action.payload],
      };
    case 'CLEAR_DAMAGE_ANIMATION':
      return {
        ...state,
        damageAnimations: state.damageAnimations.filter(anim => anim.cardId !== action.payload),
      };
    case 'TRIGGER_ENERGY_WAVE_ANIMATION':
      return {
        ...state,
        energyWaveAnimation: { show: true, amount: action.payload },
      };
    case 'CLEAR_ENERGY_WAVE_ANIMATION':
      return {
        ...state,
        energyWaveAnimation: null,
      };
    case 'TRIGGER_TURN_BANNER':
      return {
        ...state,
        turnBannerAnimation: { show: true, isPlayerTurn: action.payload },
      };
    case 'CLEAR_TURN_BANNER':
      return {
        ...state,
        turnBannerAnimation: null,
      };
    case 'TRIGGER_SPELL_CAST_ANIMATION':
      return {
        ...state,
        spellCastAnimation: { 
          show: true, 
          spell: action.payload.spell,
          startPosition: action.payload.startPosition
        },
      };
    case 'CLEAR_SPELL_CAST_ANIMATION':
      return {
        ...state,
        spellCastAnimation: null,
      };
    case 'SET_AI_STATUS':
      return {
        ...state,
        aiVisualState: {
          ...state.aiVisualState,
          status: action.payload.status,
          message: action.payload.message,
          isActive: action.payload.status !== 'idle',
        },
      };
    case 'SET_AI_HIGHLIGHT':
      return {
        ...state,
        aiVisualState: {
          ...state.aiVisualState,
          highlightedCardId: action.payload.cardId,
          targetCardId: action.payload.targetCardId,
        },
      };
    case 'CLEAR_AI_VISUALS':
      return {
        ...state,
        aiVisualState: {
          status: 'idle',
          isActive: false,
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'RESET_GAME':
      return {
        ...initialState,
        actionLog: [],
        damageAnimations: [],
      };
    default:
      return state;
  }
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { turnBanner: turnBannerEnabled } = useSettings();

  // Animation queue for sequencing turn-transition animations
  const animationQueueRef = React.useRef<AnimationQueue>(new AnimationQueue());

  // Guard against concurrent executeAITurn calls (race condition when gameState updates mid-turn)
  const isExecutingAITurnRef = React.useRef(false);

  // Configure queue callbacks once
  useEffect(() => {
    animationQueueRef.current.setCallbacks(
      // onPlay — start the animation
      (item) => {
        if (item.type === 'energyWave') {
          dispatch({ type: 'TRIGGER_ENERGY_WAVE_ANIMATION', payload: item.payload });
        } else if (item.type === 'turnBanner') {
          dispatch({ type: 'TRIGGER_TURN_BANNER', payload: item.payload });
        }
      },
      // onComplete — clean up the animation
      (item) => {
        if (item.type === 'energyWave') {
          dispatch({ type: 'CLEAR_ENERGY_WAVE_ANIMATION' });
        } else if (item.type === 'turnBanner') {
          dispatch({ type: 'CLEAR_TURN_BANNER' });
        }
      },
    );
  }, []);

  // Initialize sounds when provider mounts
  useEffect(() => {
    initializeSounds();
  }, []);

  const createActionLogEntry = (
    action: GameAction, 
    success: boolean, 
    playerName: string,
    turnNumber: number,
    description?: string
  ): ActionLogEntry => {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      turn: turnNumber,
      playerName,
      playerId: action.playerId,
      action,
      description: description || '',
      success,
    };
  };

  const getActionDescription = (action: GameAction, gameEngine: GameEngine): string => {
    const players = gameEngine.getPlayers();
    const player = players.find(p => p.id === action.playerId);
    const displayAttackName = (name?: string) => {
      if (!name) return '';
      const key = `attacks.${name}`;
      const label = t(key);
      return label === key ? name : label;
    };

    const unknownCard = t('battle.detail.unknownCard');
    const unknownTarget = t('battle.detail.unknownTarget');
    const defaultAttack = t('battle.detail.defaultAttack');

    switch (action.type) {
      case 'PLAY_CARD': {
        const card = player?.hand.find(c => c.id === action.cardId) || player?.field.find(c => c.id === action.cardId);
        return card
          ? t('battle.detail.playCard', { name: card.name })
          : t('battle.detail.playCardUnknown');
      }
      case 'CAST_SPELL': {
        const spellCard = player?.hand.find(c => c.id === action.cardId);
        return spellCard
          ? t('battle.detail.castSpell', { name: spellCard.name })
          : t('battle.detail.castSpellUnknown');
      }
      case 'ATTACK': {
        const attackerCard = player?.field.find(c => c.id === action.cardId);
        const attackerName = attackerCard?.name || unknownCard;
        const attackLabelRaw = action.attackName ? displayAttackName(action.attackName) : '';
        const attackLabel = attackLabelRaw || defaultAttack;

        if (action.targetCardId) {
          const opponent = players.find(p => p.id !== action.playerId);
          const targetCard = opponent?.field.find(c => c.id === action.targetCardId);
          const targetName = targetCard?.name || unknownTarget;

          return attackLabelRaw
            ? t('battle.detail.attackCreature', { attacker: attackerName, target: targetName, attack: attackLabel })
            : t('battle.detail.attackCreatureNoAttack', { attacker: attackerName, target: targetName });
        }

        return attackLabelRaw
          ? t('battle.detail.attackDirect', { attacker: attackerName, attack: attackLabel })
          : t('battle.detail.attackDirectNoAttack', { attacker: attackerName });
      }
      case 'RETIRE_CARD': {
        const retiredCard = player?.field.find(c => c.id === action.cardId);
        return retiredCard
          ? t('battle.detail.retireCard', { name: retiredCard.name })
          : t('battle.detail.retireCardUnknown');
      }
      case 'END_TURN':
        return t('battle.detail.endTurn');
      default:
        return t('battle.detail.unknown');
    }
  };

  const initializeGame = (playerName: string, playerDeck: Card[], aiDeck: Card[]) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const player1 = PlayerUtils.createPlayer('player1', playerName, playerDeck, false);
      const player2 = PlayerUtils.createPlayer('player2', t('player.ai'), aiDeck, true);
      
      const gameEngine = new GameEngine(player1, player2, playerDeck, aiDeck);
      
      // Set up energy gain callback — enqueue instead of triggering directly
      // so the animation waits for AI turn animations to finish
      gameEngine.setOnPlayerEnergyGain((playerId: string, amount: number) => {
        const players = gameEngine.getPlayers();
        const player = players.find(p => p.id === playerId);
        if (player && !player.isAI) {
          animationQueueRef.current.enqueue({
            type: 'energyWave',
            payload: amount,
            duration: ENERGY_WAVE_DURATION_MS,
          });
        }
      });
      
      const gameState = gameEngine.getGameState();
      
      dispatch({ 
        type: 'INITIALIZE_GAME', 
        payload: { gameEngine, gameState } 
      });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to initialize game' 
      });
    }
  };

  const executeAction = (action: GameAction) => {
    if (!state.gameEngine || !state.gameState) return;
    
    try {
      const players = state.gameEngine.getPlayers();
      const player = players.find(p => p.id === action.playerId);
      const description = getActionDescription(action, state.gameEngine);
      
      // Store previous game state to detect energy changes
      const previousGameState = state.gameEngine.getGameState();
      const previousCurrentPlayer = previousGameState.players[previousGameState.currentPlayerIndex];
      
      const success = state.gameEngine.executeAction(action);
      
      // Log the action
      const logEntry = createActionLogEntry(
        action,
        success,
        player?.name || t('battle.detail.unknownPlayer'),
        state.gameState.turnNumber,
        description
      );
      
      dispatch({ type: 'ADD_ACTION_LOG', payload: logEntry });
      
      if (success) {
        const newGameState = state.gameEngine.getGameState();
        dispatch({ type: 'UPDATE_GAME_STATE', payload: newGameState });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to execute action' 
      });
    }
  }

  // --- Affinity helpers for AI lethal timing (keep consistent with UI) ---
  const ELEMENT_CYCLE: Record<string, string> = {
    water: 'fire',
    fire: 'air',
    air: 'earth',
    earth: 'water',
  };

  function getAffinityBonus(attackerElement?: string, defenderElement?: string): number {
    if (!attackerElement || !defenderElement) return 0;
    if (defenderElement === 'all') return 0;
    if (ELEMENT_CYCLE[attackerElement] === defenderElement) return 20;
    if (ELEMENT_CYCLE[defenderElement] === attackerElement) return -20;
    return 0;
  }


  const executeAITurn = async () => {
    if (!state.gameEngine || !state.gameState) {
      return;
    }

    const currentPlayer = state.gameEngine.getCurrentPlayer();
    if (!currentPlayer.isAI) {
      return;
    }

    if (isExecutingAITurnRef.current) {
      return;
    }
    isExecutingAITurnRef.current = true;

    try {
      // Show AI is starting its turn
      dispatch({ type: 'SET_AI_STATUS', payload: { status: 'thinking', message: t('game.aiAction.planning') } });
      await delay(1700); // 1200 + 500
      
      let actionsPerformed = 0;
      const maxActions = 10;
      
      while (actionsPerformed < maxActions) {
        const currentState = state.gameEngine.getGameState();
        const currentPlayerInLoop = state.gameEngine.getCurrentPlayer();
        
        if (!currentPlayerInLoop.isAI) {
          break;
        }
        
        // AI analyzing phase
        dispatch({ type: 'SET_AI_STATUS', payload: { status: 'analyzing_hand', message: t('game.aiAction.analyzing') } });
        await delay(1300); // 800 + 500

        const aiDecision = AIEngine.makeDecision(currentState);

        // Show what AI is doing based on action type
        await showAIActionVisuals(aiDecision.action, dispatch);

        const players = state.gameEngine.getPlayers();
        const aiPlayer = players.find(p => p.id === currentPlayerInLoop.id);
        const description = getActionDescription(aiDecision.action, state.gameEngine);

        // Execute the action
        dispatch({ type: 'SET_AI_STATUS', payload: { status: 'executing_action', message: t('game.aiAction.executing') } });

        // Trigger damage animation for AI attacks (delay engine if lethal so animation can play)
        if (aiDecision.action.type === 'ATTACK' && aiDecision.action.targetCardId) {
          // Get attacker and target from the current state
          const attacker = currentState.players
              .find(p => p.id === currentPlayerInLoop.id)?.field
              .find(c => c.id === aiDecision.action.cardId);

          const target = currentState.players
              .find(p => p.id !== currentPlayerInLoop.id)?.field
              .find(c => c.id === aiDecision.action.targetCardId);

          // Predict lethality (base + affinity)
          const base = Number(attacker?.attacks?.find(a => a.name === aiDecision.action.attackName)?.damage ?? 0) || 0;
          const affinity = getAffinityBonus(attacker?.element as string, target?.element as string);
          const total = Math.max(0, base + affinity);
          const isPredictedLethal = !!(target && target.hp != null && total >= target.hp);

          const animMs = isPredictedLethal ? KILL_ANIM_MS : NON_KILL_ANIM_MS;

          // Show the hit animation on the target
          dispatch({
            type: 'ADD_DAMAGE_ANIMATION',
            payload: {
              cardId: aiDecision.action.targetCardId,
              isActive: true,
              duration: animMs,
              damage: total,
              isLethal: isPredictedLethal,
              attackElement: attacker?.element as Element | undefined,
            },
          });

          // If lethal, wait so the card isn't removed before the animation is seen
          if (isPredictedLethal) {
            await delay(animMs);
          }
        }

        // Execute the AI action after the (optional) delay
        // Special handling for spell casting to trigger animation
        if (aiDecision.action.type === 'CAST_SPELL' && aiDecision.action.cardId) {
          const spell = aiPlayer?.hand.find(c => c.id === aiDecision.action.cardId);
          if (spell) {
            // Trigger spell cast animation for AI
            dispatch({ 
              type: 'TRIGGER_SPELL_CAST_ANIMATION', 
              payload: { 
                spell, 
                startPosition: { x: 50, y: 100 } // AI spells from top area
              } 
            });
            
            // Delay execution to allow animation to start
            await delay(SPELL_CAST_ENGINE_DELAY_MS);
          }
        }
        
        const success = state.gameEngine.executeAction(aiDecision.action);
        
        // Log the AI action
        const logEntry = createActionLogEntry(
          aiDecision.action,
          success,
          aiPlayer?.name || t('player.ai'),
          currentState.turnNumber,
          description
        );
        
        dispatch({ type: 'ADD_ACTION_LOG', payload: logEntry });
        
        // Clear highlights and show result
        dispatch({ type: 'CLEAR_AI_VISUALS' });
        await delay(1300); // 800 + 500
        
        if (success) {
          actionsPerformed++;
          
          // Update game state after each action
          const newGameState = state.gameEngine.getGameState();
          dispatch({ type: 'UPDATE_GAME_STATE', payload: newGameState });
          
          if (aiDecision.action.type === 'END_TURN' || aiDecision.action.type === 'ATTACK') {
            break;
          }
          
          // Small pause between actions
          await delay(1000); // 500 + 500
        } else {
          const endTurnSuccess = state.gameEngine.executeAction({
            type: 'END_TURN',
            playerId: currentPlayerInLoop.id,
          });
          if (!endTurnSuccess) {
            if (__DEV__) {
              console.error('Failed to end AI turn - breaking loop');
            }
          }
          break;
        }
      }
      
      if (actionsPerformed >= maxActions) {
        const currentPlayerAfterLoop = state.gameEngine.getCurrentPlayer();
        if (currentPlayerAfterLoop.isAI) {
          state.gameEngine.executeAction({
            type: 'END_TURN',
            playerId: currentPlayerAfterLoop.id,
          });
        }
      }
      
      // Final game state update
      const newGameState = state.gameEngine.getGameState();
      dispatch({ type: 'UPDATE_GAME_STATE', payload: newGameState });

      // Clear all AI visuals
      dispatch({ type: 'CLEAR_AI_VISUALS' });

      const turnPassedToPlayer = !newGameState.players[newGameState.currentPlayerIndex].isAI;

      if (turnPassedToPlayer) {
        // Prepend turn banner (plays before energy wave)
        if (turnBannerEnabled) {
          animationQueueRef.current.prepend({
            type: 'turnBanner',
            payload: true, // isPlayerTurn = true (AI turn just ended)
            duration: TURN_TRANSITION_DURATION_MS,
          });
        }

        // Play queued turn-transition animations (banner, then energy wave)
        await animationQueueRef.current.flush();
      }

    } catch (error) {
      dispatch({ type: 'CLEAR_AI_VISUALS' });
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'AI turn failed'
      });
    } finally {
      isExecutingAITurnRef.current = false;
    }
  };

  const resetGame = () => {
    animationQueueRef.current.clear();
    dispatch({ type: 'RESET_GAME' });
  };

  const triggerDamageAnimation = (cardId: string, duration: number = 1000, extra?: Pick<DamageAnimation, 'damage' | 'isLethal' | 'attackElement'>) => {
    const animation: DamageAnimation = {
      cardId,
      isActive: true,
      duration,
      ...extra,
    };

    dispatch({ type: 'ADD_DAMAGE_ANIMATION', payload: animation });
  };

  const clearDamageAnimation = (cardId: string) => {
    dispatch({ type: 'CLEAR_DAMAGE_ANIMATION', payload: cardId });
  };

  const triggerEnergyWaveAnimation = (amount: number) => {
    dispatch({ type: 'TRIGGER_ENERGY_WAVE_ANIMATION', payload: amount });
  };

  const clearEnergyWaveAnimation = () => {
    dispatch({ type: 'CLEAR_ENERGY_WAVE_ANIMATION' });
  };

  const triggerSpellCastAnimation = (spell: Card, startPosition: { x: number; y: number }) => {
    dispatch({ type: 'TRIGGER_SPELL_CAST_ANIMATION', payload: { spell, startPosition } });
  };

  const clearSpellCastAnimation = () => {
    dispatch({ type: 'CLEAR_SPELL_CAST_ANIMATION' });
  };

  const setAIStatus = (status: AIStatus, message?: string) => {
    dispatch({ type: 'SET_AI_STATUS', payload: { status, message } });
  };

  const setAIHighlight = (cardId?: string, targetCardId?: string) => {
    dispatch({ type: 'SET_AI_HIGHLIGHT', payload: { cardId, targetCardId } });
  };

  const clearAIVisuals = () => {
    dispatch({ type: 'CLEAR_AI_VISUALS' });
  };

  return (
    <GameContext.Provider
      value={{
        ...state,
        initializeGame,
        executeAction,
        executeAITurn,
        resetGame,
        triggerDamageAnimation,
        clearDamageAnimation,
        triggerEnergyWaveAnimation,
        clearEnergyWaveAnimation,
        triggerSpellCastAnimation,
        clearSpellCastAnimation,
        setAIStatus,
        setAIHighlight,
        clearAIVisuals,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// Helper functions for AI visuals
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const showAIActionVisuals = async (action: GameAction, dispatch: React.Dispatch<GameAction_Context>) => {
  switch (action.type) {
    case 'PLAY_CARD':
      dispatch({ type: 'SET_AI_STATUS', payload: { status: 'selecting_card_to_play', message: t('game.aiAction.selectingCardToPlay') } });
      if (action.cardId) {
        dispatch({ type: 'SET_AI_HIGHLIGHT', payload: { cardId: action.cardId } });
      }
      await delay(1700); // 1200 + 500
      break;
      
    case 'ATTACK':
      dispatch({ type: 'SET_AI_STATUS', payload: { status: 'selecting_attacker', message: t('game.aiAction.choosingAttacker') } });
      if (action.cardId) {
        dispatch({ type: 'SET_AI_HIGHLIGHT', payload: { cardId: action.cardId } });
      }
      await delay(1500); // 1000 + 500
      
      {
        const key = action.attackName ? `attacks.${action.attackName}` : '';
        const translated = key ? t(key) : '';
        const name = key && translated !== key ? translated : (action.attackName || '');
        const attackName = name || t('game.aiAction.defaultAttackName');
        dispatch({ type: 'SET_AI_STATUS', payload: { status: 'selecting_attack', message: t('game.aiAction.preparingAttack', { name: attackName }) } });
      }
      await delay(1300); // 800 + 500
      
      if (action.targetCardId) {
        dispatch({ type: 'SET_AI_STATUS', payload: { status: 'selecting_target', message: t('game.aiAction.selectingTarget') } });
        dispatch({ type: 'SET_AI_HIGHLIGHT', payload: { cardId: action.cardId, targetCardId: action.targetCardId } });
        await delay(1500); // 1000 + 500
      } else {
        dispatch({ type: 'SET_AI_STATUS', payload: { status: 'attacking_directly', message: t('game.aiAction.attackingDirectly') } });
        await delay(1300); // 800 + 500
      }
      break;
      
    case 'RETIRE_CARD':
      dispatch({ type: 'SET_AI_STATUS', payload: { status: 'selecting_card_to_retire', message: t('game.aiAction.selectingCardToRetire') } });
      if (action.cardId) {
        dispatch({ type: 'SET_AI_HIGHLIGHT', payload: { cardId: action.cardId } });
      }
      await delay(1000);
      break;
      
    case 'END_TURN':
      dispatch({ type: 'SET_AI_STATUS', payload: { status: 'ending_turn', message: t('game.aiAction.endingTurn') } });
      await delay(600);
      break;
      
    default:
      await delay(500);
      break;
  }
};

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
