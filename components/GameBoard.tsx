import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { showErrorAlert, showWarningAlert } from '@/utils/alerts';
import { KILL_ANIM_MS, NON_KILL_ANIM_MS, CARD_RETIRE_DURATION_MS } from '../constants/animation';
import { useGame } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import { useDecks } from '../context/DeckContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { CardComponent } from './CardComponent';
import { CardActionButtons } from './CardActionButtons';
import { Battlefield } from './board/Battlefield';
import { PlayerInfo } from './board/PlayerInfo';
import { StatusBar } from './board/StatusBar';
import { ActionLog } from './ActionLog';
import { Sidebar } from './Sidebar';
import { EnergyWaveAnimation } from './Animation/EnergyWaveAnimation';
import { SpellCastAnimation } from './Animation/SpellCastAnimation';
import { RulesContent } from './RulesContent';
import { Card } from '../types/game';
import { t } from '../utils/i18n';
import { CardLoader } from '../utils/game/cardLoader';
import { isSpellCard } from '../models/cards-extended';
import Colors from '../constants/Colors';
import { useAnchorRegister } from '@/context/AnchorsContext';
import { COMMON_ANCHORS } from '@/types/scenes';
import { useSceneEvents } from '@/context/SceneManagerContext';
import { useSceneManager } from '@/context/SceneManagerContext';
import { BATTLEFIELD_THEMES, BattlefieldTheme } from '@/types/battlefield';
import Animated from 'react-native-reanimated';
import { useScreenShake } from '../hooks/useScreenShake';
import { TurnTransitionBanner } from './Animation/TurnTransitionBanner';
import { GameOverAnimation } from './Animation/GameOverAnimation';

export function GameBoard() {
  const { 
    gameState, 
    gameEngine, 
    actionLog, 
    damageAnimations,
    aiVisualState,
    energyWaveAnimation,
    turnBannerAnimation,
    spellCastAnimation,
    isLoading, 
    error,
    triggerDamageAnimation,
    clearDamageAnimation,
    clearEnergyWaveAnimation,
    triggerSpellCastAnimation,
    clearSpellCastAnimation,
    resetGame,
    initializeGame
  } = useGame();
  const { activeDeck } = useDecks();
  const { avatarCreature, pseudo } = useAuth();
  const { cardSize, setCardSize, showBattleLog, screenShake, turnBanner: turnBannerEnabled } = useSettings();
  const sceneManager = useSceneManager();
  const { playCard, castSpell, attack, retireCard, endTurn, processAITurn } = useGameActions();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [attackMode, setAttackMode] = useState<{ cardId: string; attackName: string } | null>(null);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  // Blocks interactions while we delay lethal attacks for the hit animation
  const [resolvingAttack, setResolvingAttack] = useState(false);
  // Card currently playing its retire animation (fade + slide down)
  const [retiringCardId, setRetiringCardId] = useState<string | null>(null);
  const [turnBanner, setTurnBanner] = useState<{ visible: boolean; isPlayerTurn: boolean }>({ visible: false, isPlayerTurn: true });
  const publishEvent = useSceneEvents();
  const wasAITurnRef = useRef<boolean | null>(null);
  const { shakeStyle, triggerShake } = useScreenShake();

  // Screen shake on damage impacts (respects user setting)
  const prevDamageCountRef = useRef(damageAnimations.length);
  useEffect(() => {
    if (screenShake && damageAnimations.length > prevDamageCountRef.current) {
      const latest = damageAnimations[damageAnimations.length - 1];
      triggerShake(latest?.isLethal ? 8 : 4);
    }
    prevDamageCountRef.current = damageAnimations.length;
  }, [damageAnimations.length, screenShake]);

  // Anchor refs for tutorial highlights
  const topFieldRef = useRef<View | null>(null);
  const bottomFieldRef = useRef<View | null>(null);
  const bottomHandRef = useRef<View | null>(null);
  const bottomStatsRef = useRef<View | null>(null);
  const topStatsRef = useRef<View | null>(null);
  const endTurnBtnRef = useRef<TouchableOpacity | null>(null);
  const turnStatusRef = useRef<View | null>(null);

  // Register anchors (measured by AnchorsContext)
  useAnchorRegister(COMMON_ANCHORS.ENEMY_FIELD, topFieldRef);
  useAnchorRegister(COMMON_ANCHORS.FIELD_AREA, bottomFieldRef);
  useAnchorRegister(COMMON_ANCHORS.HAND_AREA, bottomHandRef);
  useAnchorRegister(COMMON_ANCHORS.ENERGY_DISPLAY, bottomStatsRef);
  useAnchorRegister(COMMON_ANCHORS.PLAYER_HP, bottomStatsRef);
  useAnchorRegister(COMMON_ANCHORS.ENEMY_HP, topStatsRef);
  useAnchorRegister(COMMON_ANCHORS.END_TURN_BUTTON, endTurnBtnRef as any);
  useAnchorRegister(COMMON_ANCHORS.TURN_STATUS, turnStatusRef);

  // Zoom configuration for GameBoard
  const { width, height } = useWindowDimensions();
  const globalZoomScale = parseFloat(process.env.EXPO_PUBLIC_ZOOM_SCALE || '1');
  const gameboardZoomScale = parseFloat(process.env.EXPO_PUBLIC_GAMEBOARD_ZOOM_SCALE || '0.75');
  const shouldZoom = Platform.OS === 'android' || (Platform.OS === 'web' && width < 768);
  // Calculate relative zoom: GameBoard wants to be at gameboardZoomScale of original (100%)
  // Parent already applies globalZoomScale, so we need: gameboardZoomScale / globalZoomScale
  const relativeZoom = gameboardZoomScale / globalZoomScale;
  const compensatedWidth = shouldZoom ? (width / gameboardZoomScale) : width;
  const compensatedHeight = shouldZoom ? (height / gameboardZoomScale) : height;
  const zoomTransform = shouldZoom ? [{ scale: relativeZoom }] : undefined;

  useEffect(() => {
    if (!gameState || !gameEngine) return;

    const currentPlayer = gameEngine.getCurrentPlayer();
    const isAITurn = currentPlayer.isAI;
    const previous = wasAITurnRef.current;

    if (previous === null) {
      wasAITurnRef.current = isAITurn;
      return;
    }

    if (!previous && isAITurn) {
      sceneManager.setFlag('ai_turn_completed', false);
    } else if (previous && !isAITurn) {
      sceneManager.setFlag('ai_turn_completed', true);
    }

    // Show turn banner for player→AI transition (AI→player is handled by animation queue)
    if (turnBannerEnabled && !previous && isAITurn) {
      setTurnBanner({ visible: true, isPlayerTurn: false });
    }

    wasAITurnRef.current = isAITurn;
  }, [gameState?.currentPlayerIndex, gameState?.phase, gameState?.turnNumber, gameEngine, sceneManager]);


  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);
  const closeSidebar = () => setSidebarVisible(false);

  // Element cycle used for affinity: water > fire, fire > air, air > earth, earth > water
  const ELEMENT_CYCLE: Record<string, string> = {
    water: 'fire',
    fire: 'air',
    air: 'earth',
    earth: 'water',
  };

  const DEFAULT_BATTLEFIELD_THEME_BY_POSITION: Record<'top' | 'bottom', string> = {
    top: 'default',
    bottom: 'default',
  };

  const getPlayerTheme = useCallback(
    (position: 'top' | 'bottom'): BattlefieldTheme => {
      const themeId = DEFAULT_BATTLEFIELD_THEME_BY_POSITION[position] ?? 'default';
      return (
        BATTLEFIELD_THEMES.find((theme) => theme.id === themeId) ?? BATTLEFIELD_THEMES[0]
      );
    },
    []
  );

  // Clear any stale attack preview when switching the selected attacker
  useEffect(() => {
    // If the player picks another card, drop the previous preview immediately
    setAttackMode(null);
  }, [selectedCard]);


  /**
   * Returns the affinity bonus: +20, -20, or 0.
   * If defender is "all" (multi-element in defense), affinity is neutral (0).
   */
  function getAffinityBonus(attackerElement?: string, defenderElement?: string): number {
    if (!attackerElement || !defenderElement) return 0;
    if (defenderElement === 'all') return 0; // multi-element defense → neutral
    if (ELEMENT_CYCLE[attackerElement] === defenderElement) return 20;
    if (ELEMENT_CYCLE[defenderElement] === attackerElement) return -20;
    return 0;
  }


  /**
   * Computes damage preview for the selected attack against a target.
   * total = base + affinity (clamped to >= 0)
   */
  function getPreviewDamage(attacker: Card, attackName: string, target: Card) {
    const atk = attacker.attacks.find((a: any) => a.name === attackName);
    if (!atk) return null;
    const base = Number(atk.damage ?? 0) || 0;
    const affinity = getAffinityBonus(attacker.element as any, target.element as any);
    const total = Math.max(0, base + affinity);
    return { base, affinity, total };
  }

  // Show deck selection if no game is active
  useEffect(() => {
    if (!gameState && !isLoading && !showDeckSelection) {
      setShowDeckSelection(true);
    }
  }, [gameState, isLoading, showDeckSelection]);

  const startGameWithDeck = (playerDeck: Card[]) => {
    const allCards = CardLoader.loadCards();
    const aiDeck = allCards.slice(20, 40); // AI uses demo deck
    
    initializeGame(t('player.you'), playerDeck, aiDeck);
    setShowDeckSelection(false);
  };

  const startWithActiveDeck = () => {
    if (activeDeck && activeDeck.cards.length >= 20) {
      startGameWithDeck(activeDeck.cards);
    } else {
      showErrorAlert(
        t('decks.invalidDeckTitle'),
        activeDeck
          ? t('decks.invalidDeckMin', { min: '20' })
          : t('decks.noActiveDeck')
      );
    }
  };

  const startWithDemoDeck = () => {
    const allCards = CardLoader.loadCards();
    const playerDeck = allCards.slice(0, 20); // Demo deck for player
    
    startGameWithDeck(playerDeck);
  };

  // Auto-process AI turns
  useEffect(() => {
    if (!gameState || !gameEngine || gameState.isGameOver || aiVisualState.isActive) return;
    
    const currentPlayer = gameEngine.getCurrentPlayer();
    
    if (currentPlayer.isAI && gameState.phase === 'main') {
      const timeoutId = setTimeout(() => {
        processAITurn();
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [gameState?.currentPlayerIndex, gameState?.phase, gameState?.turnNumber, processAITurn, gameEngine, gameState, aiVisualState.isActive]);

  // Auto-clear damage animations after duration
  useEffect(() => {
    const timeoutIds = damageAnimations
        .filter(anim => anim.isActive && anim.duration > 0)
        .map(anim => setTimeout(() => {
          clearDamageAnimation(anim.cardId);
        }, anim.duration));

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [damageAnimations, clearDamageAnimation]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('game.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (showDeckSelection) {
    return (
      <View style={styles.centered}>
        <Text style={styles.deckSelectionTitle}>{t('decks.selection.title')}</Text>
        <Text style={styles.deckSelectionSubtitle}>
          {t('decks.selection.subtitle')}
        </Text>
        
        <View style={styles.deckOptions}>
          {activeDeck && (
            <TouchableOpacity 
              style={[styles.deckOption, styles.activeDeckOption]}
              onPress={startWithActiveDeck}
            >
              <Text style={styles.deckOptionTitle}>{t('decks.selection.useActive')}</Text>
              <Text style={styles.deckOptionName}>"{activeDeck.name}"</Text>
              <Text style={styles.deckOptionStats}>
                {t('decks.selection.cardCount', { count: String(activeDeck.cards.length) })}
              </Text>
              {activeDeck.cards.length < 20 && (
                <Text style={styles.deckOptionWarning}>
                  ⚠️ {t('decks.selection.needMin', { min: '20' })}
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.deckOption, styles.demoDeckOption]}
            onPress={startWithDemoDeck}
          >
            <Text style={styles.deckOptionTitle}>{t('decks.selection.useDemo')}</Text>
            <Text style={styles.deckOptionName}>{t('decks.selection.demoName')}</Text>
            <Text style={styles.deckOptionStats}>{t('decks.selection.demoStats')}</Text>
            <Text style={styles.deckOptionDescription}>
              {t('decks.selection.demoDesc')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {!activeDeck && (
          <Text style={styles.noDeckMessage}>
            💡 {t('decks.selection.noDeckMessage')}
          </Text>
        )}
      </View>
    );
  }

  if (!gameState || !gameEngine) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('game.error')}</Text>
      </View>
    );
  }

  const currentPlayer = gameEngine.getCurrentPlayer();
  const isPlayerTurn = !currentPlayer.isAI;

  const handleCardPress = (card: Card) => {
    // Prevent interactions during a delayed lethal resolution
    if (!isPlayerTurn || resolvingAttack) return;

    if (attackMode) {
      // Predict lethality to decide if we should delay engine resolution
      const attacker = playerAtBottom.field.find(c => c.id === attackMode.cardId);
      const preview = attacker ? getPreviewDamage(attacker, attackMode.attackName, card) : null;
      const isPredictedLethal = !!(preview && card.hp != null && preview.total >= card.hp);

      // Play the hit animation on the target card first
      const animMs = isPredictedLethal ? KILL_ANIM_MS : NON_KILL_ANIM_MS;

      if (card.id) {
        // Triggers the existing per-card DamageEffect animation
        triggerDamageAnimation(card.id, animMs, {
          damage: preview?.total,
          isLethal: isPredictedLethal,
          attackElement: attacker?.element,
        });
      }

      // Clear UI selection immediately
      setAttackMode(null);
      setSelectedCard(null);

      if (isPredictedLethal) {
        // Delay the engine attack so the card is not removed before the animation
        setResolvingAttack(true);
        setTimeout(() => {
          // Resolve attack in engine (engine will handle auto-end turn logic)
          attack(attacker!.id!, attackMode.attackName, card.id!);
          publishEvent({ type: 'attack_used' });
          setResolvingAttack(false);
        }, KILL_ANIM_MS);
      } else {
        // Non-lethal: resolve immediately (engine will handle auto-end turn logic)
        attack(attacker!.id!, attackMode.attackName, card.id!);
        publishEvent({ type: 'attack_used' });
      }
    } else {
      setSelectedCard(card.id === selectedCard ? null : card.id!);
    }
  };

  const handlePlayCard = (cardId: string) => {
    const currentPlayer = gameEngine.getCurrentPlayer();
    const card = currentPlayer.hand.find(c => c.id === cardId);
    
    if (!card) {
      showErrorAlert(t('game.cardNotFoundTitle'), t('game.cardNotFoundBody'));
      return;
    }
    
    if (isSpellCard(card)) {
      // Handle spell casting
      if (currentPlayer.energy < card.energyCost) {
        showWarningAlert(
          t('combat.notEnoughEnergy'),
          t('combat.insufficientEnergySpell', { required: String(card.energyCost), current: String(currentPlayer.energy) })
        );
        return;
      }
      
      castSpell(cardId);
      publishEvent({ type: 'card_played' });
    } else {
      // Handle monster card playing
      if (currentPlayer.field.length >= 4) {
        showWarningAlert(t('combat.fieldFullTitle'), t('combat.fieldFullBody'));
        return;
      }
      
      playCard(cardId);
      publishEvent({ type: 'card_played' });
    }
    
    setSelectedCard(null);
  };

  const handleAttack = (cardId: string, attackName: string) => {
    // Validate energy before allowing attack
    const currentPlayer = gameEngine.getCurrentPlayer();
    const attackerCard = currentPlayer.field.find(c => c.id === cardId);
    const attack = attackerCard?.attacks.find(a => a.name === attackName);
    
    if (!attack || currentPlayer.energy < attack.energy) {
      showWarningAlert(
        t('combat.notEnoughEnergy'),
        t('combat.insufficientEnergyAttack', { required: String(attack?.energy || 0), current: String(currentPlayer.energy) })
      );
      return;
    }
    
    const opponent = gameEngine.getOpponent();
    if (opponent.field.length === 0) {
      // No targets available
      showWarningAlert(t('combat.noTargetsTitle'), t('combat.noTargetsBody'));
      return;
    }
    
    // Select target
    setAttackMode({ cardId, attackName });
    showWarningAlert(t('actions.selectTarget'), t('actions.selectTargetHint'));
  };

  const handleRetire = (cardId: string) => {
    // Retire costs 1 energy — don't animate if the action will fail
    const currentPlayer = gameEngine?.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.energy < 1) return;

    setRetiringCardId(cardId);
    setSelectedCard(null);
    setTimeout(() => {
      retireCard(cardId);
      setRetiringCardId(null);
    }, CARD_RETIRE_DURATION_MS);
  };

  const handleEndTurn = () => {
    // Player ending turn manually
    endTurn();
    setSelectedCard(null);
    setAttackMode(null);
    publishEvent({ type: 'turn_ended' });
    // AI turn will be automatically triggered by useEffect
  };

  const getDamageAnimationForCard = (cardId: string) => {
    return damageAnimations.find(anim => anim.cardId === cardId);
  };

  const isCardHighlighted = (cardId: string) => {
    return aiVisualState.isActive && 
           (aiVisualState.highlightedCardId === cardId || aiVisualState.targetCardId === cardId);
  };

  const getCardHighlightType = (cardId: string) => {
    if (!aiVisualState.isActive) return null;
    if (aiVisualState.highlightedCardId === cardId) return 'selected';
    if (aiVisualState.targetCardId === cardId) return 'target';
    return null;
  };

  const getAIStatusMessage = (status: string) => {
    const key = `game.aiStatus.${status}`;
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
    return t('game.aiStatus.default');
  };

  // Always show current player at bottom, opponent at top regardless of whose turn it is
  const playerAtBottom = gameEngine.getPlayers()[0]; // Player 1 (human)
  const playerAtTop = gameEngine.getPlayers()[1]; // Player 2 (opponent)

  const turnLabelText = t('game.turnLabel', {
    n: String(gameState.turnNumber),
    who: isPlayerTurn ? t('game.yourTurn') : t('game.aiTurn'),
  });

  const phaseLabelText = t('game.phaseLabel', { phase: t(`phases.${gameState.phase}`) });

  const aiStatusText = aiVisualState.isActive
    ? `🤖 ${aiVisualState.message || getAIStatusMessage(aiVisualState.status)}`
    : null;

  if (gameState.isGameOver) {
    const handlePlayAgain = () => {
      const humanPlayer = playerAtBottom;
      const aiPlayer = playerAtTop;
      resetGame();
      setTimeout(() => {
        initializeGame(humanPlayer.name, humanPlayer.deck, aiPlayer.deck);
      }, 100);
    };

    const handleReturnToMenu = () => {
      resetGame();
      setShowDeckSelection(true);
    };

    const isPlayerVictory = gameState.winner === playerAtBottom.id;
    const winnerName = isPlayerVictory ? (pseudo || playerAtBottom.name) : playerAtTop.name;

    const getWinReasonText = () => {
      const prefix = isPlayerVictory ? 'game_over.reason' : 'game_over.defeat_reason';
      switch (gameState.winReason) {
        case 'points':
          return t(`${prefix}.points`);
        case 'deckout':
          return t(`${prefix}.noCards`);
        case 'fieldwipe':
          return t(`${prefix}.noMonsters`);
        default:
          return '';
      }
    };

    return (
      <GameOverAnimation
        isVictory={isPlayerVictory}
        winnerName={winnerName}
        winReason={getWinReasonText()}
        onPlayAgain={handlePlayAgain}
        onReturnToMenu={handleReturnToMenu}
      />
    );
  }

  const zoomWrapperStyle = shouldZoom ? {
    width: compensatedWidth,
    height: compensatedHeight,
    transform: zoomTransform,
    transformOrigin: 'top left' as const,
  } : { flex: 1 };

  return (
    <View style={zoomWrapperStyle}>
      <Animated.View style={[styles.mainContainer, shakeStyle]}>
        <ScrollView style={styles.gameContainer}>
      {/* Top Player Info */}
      <PlayerInfo
        name={playerAtTop.name}
        stats={[
          { label: t('player.energy'), value: playerAtTop.energy },
          { label: t('player.points'), value: playerAtTop.points },
          { label: t('player.hand'), value: playerAtTop.hand.length },
        ]}
        containerRef={topStatsRef as any}
        avatarCreature={null}
        avatarPosition="right"
      />

      {/* Top Player Field */}
      <Battlefield
        label={t('player.opponentField')}
        cards={playerAtTop.field}
        theme={getPlayerTheme('top')}
        position="top"
        containerRef={topFieldRef as any}
        cardSize={cardSize}
        selectedCardId={selectedCard}
        disabled={!isPlayerTurn || !attackMode || resolvingAttack}
        attackMode={attackMode}
        previewDamage={(card) => {
          if (!isPlayerTurn || !attackMode) return null;
          const attacker = playerAtBottom.field.find((c) => c.id === attackMode.cardId);
          return attacker ? getPreviewDamage(attacker, attackMode.attackName, card) : null;
        }}
        aiHighlight={getCardHighlightType}
        damageAnimation={getDamageAnimationForCard}
        emptyLabel={t('game.noCreaturesOnField')}
        onCardPress={handleCardPress}
      />

      {/* Game Info */}
      <StatusBar
        containerRef={turnStatusRef as any}
        turnLabel={turnLabelText}
        phaseLabel={phaseLabelText}
        aiStatus={aiStatusText}
        cardSize={cardSize}
        onToggleCardSize={() => setCardSize(cardSize === 'small' ? 'normal' : 'small')}
        onShowRules={() => setRulesVisible(true)}
        showBattleLog={showBattleLog}
        isBattleLogOpen={sidebarVisible}
        onToggleBattleLog={toggleSidebar}
        rulesAccessibilityLabel={t('decks.rulesA11y')}
        showEndTurnButton={currentPlayer.id === playerAtBottom.id && isPlayerTurn}
        endTurnLabel={t('actions.endTurn')}
        onEndTurn={handleEndTurn}
        endTurnButtonRef={endTurnBtnRef as any}
      />
        

      {/* Bottom Player Field */}
      <Battlefield
        label={t('player.yourField')}
        cards={playerAtBottom.field}
        theme={getPlayerTheme('bottom')}
        position="bottom"
        containerRef={bottomFieldRef as any}
        cardSize={cardSize}
        selectedCardId={selectedCard}
        disabled={!isPlayerTurn || resolvingAttack}
        aiHighlight={getCardHighlightType}
        damageAnimation={getDamageAnimationForCard}
        retiringCardId={retiringCardId}
        playerEnergy={playerAtBottom.energy}
        currentTurn={gameState.turnNumber}
        isFirstPlayer={playerAtBottom.id === gameState.players[0].id}
        emptyLabel={t('game.noCreaturesOnField')}
        onCardPress={(card) => {
          const willSelect = card.id !== selectedCard;
          setSelectedCard(willSelect ? card.id : null);
          if (willSelect) publishEvent({ type: 'creature_selected' });
          setAttackMode(null);
        }}
        onAttack={handleAttack}
        cardComponentProps={(card) => ({
          showActions:
            currentPlayer.id === playerAtBottom.id &&
            isPlayerTurn &&
            selectedCard === card.id &&
            !gameState.attackedThisTurn.has(card.id),
          disabled:
            currentPlayer.id !== playerAtBottom.id || !isPlayerTurn || resolvingAttack,
        })}
        renderCardActions={(card) => {
          const visible =
            selectedCard === card.id &&
            currentPlayer.id === playerAtBottom.id &&
            isPlayerTurn &&
            !gameState.attackedThisTurn.has(card.id);

          if (!visible) {
            return null;
          }

          return (
            <CardActionButtons
              visible={true}
              showRetire={true}
              onRetire={() => handleRetire(card.id)}
              cardSize={cardSize}
            />
          );
        }}
      />

      {/* Bottom Player Info */}
      <PlayerInfo
        name={pseudo || playerAtBottom.name}
        stats={[
          { label: t('player.energy'), value: playerAtBottom.energy },
          { label: t('player.points'), value: playerAtBottom.points },
          { label: t('player.hand'), value: playerAtBottom.hand.length },
        ]}
        containerRef={bottomStatsRef as any}
        avatarCreature={avatarCreature}
        avatarPosition="left"
      />

      {/* Bottom Player Hand */}
      <View style={styles.hand} ref={bottomHandRef as any}>
        <Text style={styles.fieldLabel}>{t('player.hand')}</Text>
        <ScrollView horizontal style={styles.cardRow}>
          {playerAtBottom.hand.map((card) => (
            <View key={card.id} style={{ marginRight: 12, position: 'relative' }}>
              <CardComponent
                card={card}
                selected={selectedCard === card.id}
                onPress={() => setSelectedCard(card.id === selectedCard ? null : card.id!)}
                disabled={currentPlayer.id !== playerAtBottom.id || !isPlayerTurn}
                aiHighlight={getCardHighlightType(card.id!)}
                size={cardSize}
              />
              
              {/* Card Action Buttons */}
              <CardActionButtons
                visible={selectedCard === card.id && currentPlayer.id === playerAtBottom.id && isPlayerTurn}
                showPlay={true}
                onPlay={() => handlePlayCard(card.id!)}
                cardSize={cardSize}
                card={card}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Action buttons removed - now handled by CardActionButtons overlay */}

      {attackMode && (
        <View style={styles.attackModeIndicator}>
          <Text style={styles.attackModeText}>
            {t('game.attackMode', { name: (() => {
              const key = `attacks.${attackMode.attackName}`;
              const label = t(key);
              return label === key ? attackMode.attackName : label;
            })() })}
          </Text>
        </View>
      )}
      </ScrollView>
      
      {/* Reusable Sidebar */}
      {showBattleLog && (
        <Sidebar
          visible={sidebarVisible}
          onClose={closeSidebar}
          title={t('battle.actionLog')}
        >
          <ActionLog logs={actionLog} sidebarMode={true} />
        </Sidebar>
      )}

      {/* Rules Sidebar */}
      <Sidebar
        visible={rulesVisible}
        onClose={() => setRulesVisible(false)}
        title={t('decks.rulesTitle')}
      >
        <RulesContent context="battle" />
      </Sidebar>

      {/* Energy Wave Animation */}
      {energyWaveAnimation && energyWaveAnimation.show && (
        <EnergyWaveAnimation
          energyAmount={energyWaveAnimation.amount}
          onComplete={clearEnergyWaveAnimation}
        />
      )}

      {/* Spell Cast Animation */}
      {spellCastAnimation && spellCastAnimation.show && (
        <SpellCastAnimation
          spell={spellCastAnimation.spell}
          startPosition={spellCastAnimation.startPosition}
          onComplete={clearSpellCastAnimation}
        />
      )}

      {/* Turn Transition Banner — from queue (AI→player) or local state (player→AI) */}
      <TurnTransitionBanner
        isPlayerTurn={turnBannerAnimation?.isPlayerTurn ?? turnBanner.isPlayerTurn}
        visible={!!turnBannerAnimation?.show || turnBanner.visible}
        onComplete={() => setTurnBanner(prev => ({ ...prev, visible: false }))}
      />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
  },
  field: {
    margin: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: Colors.text.primary,
  },
  cardRow: {
    flexDirection: 'row',
  },
  emptyField: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: Colors.text.secondary,
    padding: 20,
  },
  hand: {
    margin: 8,
    marginBottom: 16,
  },
  attackModeIndicator: {
    backgroundColor: '#FFC107',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 0.9,
  },
  attackModeText: {
    color: '#000',
    fontWeight: 'bold',
  },
  loadingText: {
    color: Colors.text.primary,
    fontSize: 16,
  },
  deckSelectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  deckSelectionSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  deckOptions: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 16,
  },
  deckOption: {
    backgroundColor: Colors.background.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeDeckOption: {
    borderColor: Colors.primary[600],
  },
  demoDeckOption: {
    borderColor: Colors.accent[600],
  },
  deckOptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  deckOptionName: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  deckOptionStats: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  deckOptionDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deckOptionWarning: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
  noDeckMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});
