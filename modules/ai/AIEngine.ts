import { GameState, Player, Card, Attack, GameAction, AIDecision } from '../../types/game';
import { CardUtils } from '../card';
import { PlayerUtils } from '../player';
import { AffinityCalculator } from '../affinity';
import { TurnManager } from '../turn';
import { isSpellCard } from '../../models/cards-extended';

export class AIEngine {
  static makeDecision(gameState: GameState): AIDecision {
    const aiPlayer = TurnManager.getCurrentPlayer(gameState);
    const opponent = TurnManager.getOpponent(gameState);

    const possibleActions = AIEngine.getAllPossibleActions(gameState, aiPlayer, opponent);
    
    if (possibleActions.length === 0) {
      return {
        action: {
          type: 'END_TURN',
          playerId: aiPlayer.id,
        },
        priority: 0,
        reasoning: 'No valid actions available',
      };
    }

    const scoredActions = possibleActions.map(action => ({
      ...action,
      score: AIEngine.scoreAction(action.action, gameState, aiPlayer, opponent),
    }));

    scoredActions.sort((a, b) => b.score - a.score);
    
    // Add END_TURN as an option with moderate priority
    const endTurnAction: AIDecision = {
      action: {
        type: 'END_TURN',
        playerId: aiPlayer.id,
      },
      priority: 3,
      reasoning: 'End turn',
      score: 30, // Moderate score so AI will end turn if no better options
    };
    
    // If best action score is low, prefer ending turn
    if (scoredActions[0].score < 40) {
      return endTurnAction;
    }
    
    return scoredActions[0];
  }

  private static getAllPossibleActions(gameState: GameState, aiPlayer: Player, opponent: Player): AIDecision[] {
    const actions: AIDecision[] = [];

    actions.push(...AIEngine.getPlayCardActions(aiPlayer));
    actions.push(...AIEngine.getCastSpellActions(aiPlayer));
    actions.push(...AIEngine.getAttackActions(gameState, aiPlayer, opponent));
    actions.push(...AIEngine.getRetireActions(aiPlayer));

    return actions;
  }

  private static getPlayCardActions(player: Player): AIDecision[] {
    const actions: AIDecision[] = [];

    for (const card of player.hand) {
      // Only generate PLAY_CARD actions for monster cards
      if (!isSpellCard(card) && PlayerUtils.canPlayCard(player, card)) {
        actions.push({
          action: {
            type: 'PLAY_CARD',
            playerId: player.id,
            cardId: card.id,
          },
          priority: 5,
          reasoning: `Play ${card.name} (${card.rarity})`,
        });
      }
    }

    return actions;
  }

  private static getCastSpellActions(player: Player): AIDecision[] {
    const actions: AIDecision[] = [];

    for (const card of player.hand) {
      if (isSpellCard(card)) {
        const canCast = PlayerUtils.canCastSpell(player, card);
        
        if (canCast) {
          const priority = AIEngine.getSpellPriority(card);
          
          actions.push({
            action: {
              type: 'CAST_SPELL',
              playerId: player.id,
              cardId: card.id,
            },
            priority: priority,
            reasoning: `Cast ${card.name} (${card.spellType})`,
          });
        }
      }
    }

    return actions;
  }

  private static getAttackActions(gameState: GameState, player: Player, opponent: Player): AIDecision[] {
    const actions: AIDecision[] = [];

    for (const attackerCard of player.field) {
      if (!CardUtils.canAttack(attackerCard, gameState.turnNumber)) continue;

      for (const attack of attackerCard.attacks) {
        if (player.energy < attack.energy) continue;

        if (opponent.field.length > 0) {
          for (const targetCard of opponent.field) {
            actions.push({
              action: {
                type: 'ATTACK',
                playerId: player.id,
                cardId: attackerCard.id,
                targetCardId: targetCard.id,
                attackName: attack.name,
              },
              priority: 8,
              reasoning: `Attack ${targetCard.name} with ${attackerCard.name}`,
            });
          }
        } else {
          actions.push({
            action: {
              type: 'ATTACK',
              playerId: player.id,
              cardId: attackerCard.id,
              attackName: attack.name,
            },
            priority: 10,
            reasoning: `Direct attack with ${attackerCard.name}`,
          });
        }
      }
    }

    return actions;
  }

  private static getRetireActions(player: Player): AIDecision[] {
    const actions: AIDecision[] = [];

    for (const card of player.field) {
      if (card.id && PlayerUtils.canRetireCard(player, card.id)) {
        actions.push({
          action: {
            type: 'RETIRE_CARD',
            playerId: player.id,
            cardId: card.id,
          },
          priority: 2,
          reasoning: `Retire ${card.name} (low HP: ${card.hp})`,
        });
      }
    }

    return actions;
  }

  private static scoreAction(action: GameAction, gameState: GameState, aiPlayer: Player, opponent: Player): number {
    let score = 0;

    switch (action.type) {
      case 'PLAY_CARD':
        score = AIEngine.scorePlayCard(action, aiPlayer);
        break;
        
      case 'ATTACK':
        score = AIEngine.scoreAttack(action, gameState, aiPlayer, opponent);
        break;
        
      case 'RETIRE_CARD':
        score = AIEngine.scoreRetire(action, aiPlayer);
        break;
        
      case 'CAST_SPELL':
        score = AIEngine.scoreSpell(action, aiPlayer, gameState);
        break;
        
      default:
        score = 0;
    }

    return score;
  }

  private static scorePlayCard(action: GameAction, player: Player): number {
    const card = player.hand.find(c => c.id === action.cardId);
    if (!card) return 0;

    // Only score monster cards for PLAY_CARD actions
    if (isSpellCard(card)) {
      return 0; // Spells should use CAST_SPELL action, not PLAY_CARD
    }

    let score = 50;

    // Safe to access monster card properties
    score += (card.hp || 0) * 2;
    score += (card.attacks || []).reduce((sum, attack) => sum + attack.damage, 0);

    if (card.isMythic) score += 30;
    if (player.field.length < 2) score += 20;

    return score;
  }

  private static scoreAttack(action: GameAction, gameState: GameState, aiPlayer: Player, opponent: Player): number {
    const attackerCard = aiPlayer.field.find(c => c.id === action.cardId);
    if (!attackerCard) return 0;

    const attack = attackerCard.attacks.find(a => a.name === action.attackName);
    if (!attack) return 0;

    let score = 100;

    if (action.targetCardId) {
      const targetCard = opponent.field.find(c => c.id === action.targetCardId);
      if (!targetCard) return 0;

      const finalDamage = AffinityCalculator.calculateFinalDamage(attack.damage, attackerCard.element, targetCard.element);
      score += finalDamage * 3;

      if (finalDamage >= targetCard.hp) {
        score += 50;
      }

      if (AffinityCalculator.hasAdvantage(attackerCard.element, targetCard.element)) {
        score += 25;
      }

      if (targetCard.hp <= 20) {
        score += 30;
      }
    } else {
      score += 80;
    }

    if (aiPlayer.points >= 3) {
      score += 100;
    }

    return score;
  }

  private static scoreRetire(action: GameAction, player: Player): number {
    const card = player.field.find(c => c.id === action.cardId);
    if (!card) return 0;

    let score = 10;

    if (card.hp <= 10) {
      score += 30;
    }

    if (player.field.length > 3) {
      score += 20;
    }

    return score;
  }

  private static scoreSpell(action: GameAction, player: Player, gameState: GameState): number {
    const card = player.hand.find(c => c.id === action.cardId);
    if (!card || !isSpellCard(card)) return 0;

    let score = 40; // Base score for spell casting

    // Energy Catalyst gets very high score if player doesn't already have energy booster
    if (card.name === 'Energy Catalyst' && !player.hasEnergyBooster) {
      score = 120; // Very high priority for AI
      
      // Extra bonus if it's early game (more turns to benefit from effect)
      if (gameState.turnNumber <= 5) {
        score += 50;
      }
    }

    // General spell type scoring
    if (card.spellType === 'permanent') {
      score += 30; // Permanent effects are valuable
    } else if (card.spellType === 'instant') {
      score += 20; // Instant effects are decent
    }

    // Adjust score based on energy cost efficiency
    if (card.energyCost <= 2) {
      score += 10; // Cheap spells are good
    } else if (card.energyCost >= 5) {
      score -= 5; // Expensive spells are risky
    }

    return score;
  }

  private static getSpellPriority(card: any): number {
    // Energy Catalyst gets very high priority for AI
    if (card.name === 'Energy Catalyst') {
      return 8; // Higher than most actions
    }

    // Permanent spells get high priority
    if (card.spellType === 'permanent') {
      return 7;
    }

    // Instant spells get medium priority
    if (card.spellType === 'instant') {
      return 6;
    }

    // Continuous spells get medium-low priority
    if (card.spellType === 'continuous') {
      return 5;
    }

    return 5; // Default priority
  }
}