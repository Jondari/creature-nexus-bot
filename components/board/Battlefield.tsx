import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardComponent } from '../CardComponent';
import Colors from '@/constants/Colors';
import { Card, DamageAnimation } from '@/types/game';
import { BattlefieldTheme } from '@/types/battlefield';
import { BattlefieldParticles } from './BattlefieldParticles';

interface AttackModeState {
  cardId: string;
  attackName: string;
}

interface BattlefieldProps {
  label: string;
  cards: Card[];
  theme: BattlefieldTheme;
  position: 'top' | 'bottom';
  containerRef?: React.Ref<View>;
  onCardPress?: (card: Card) => void;
  onAttack?: (cardId: string, attackName: string) => void;
  cardComponentProps?: (card: Card) => Partial<React.ComponentProps<typeof CardComponent>>;
  renderCardActions?: (card: Card) => React.ReactNode;
  cardSize?: 'small' | 'normal';
  selectedCardId?: string | null;
  disabled?: boolean;
  attackMode?: AttackModeState | null;
  previewDamage?: (card: Card) => { base: number; affinity: number; total: number } | null;
  aiHighlight?: (cardId: string) => 'selected' | 'target' | null;
  damageAnimation?: (cardId: string) => DamageAnimation | undefined;
  retiringCardId?: string | null;
  playerEnergy?: number;
  currentTurn?: number;
  isFirstPlayer?: boolean;
  emptyLabel?: string;
}

export function Battlefield({
  label,
  cards,
  theme,
  position,
  containerRef,
  onCardPress,
  onAttack,
  cardComponentProps,
  renderCardActions,
  cardSize = 'normal',
  selectedCardId,
  disabled = false,
  attackMode,
  previewDamage,
  aiHighlight,
  damageAnimation,
  retiringCardId,
  playerEnergy,
  currentTurn,
  isFirstPlayer,
  emptyLabel = 'No creatures on field',
}: BattlefieldProps) {
  // Track card IDs currently on the field to detect new entries
  const seenCardIds = useRef<Set<string>>(new Set());
  const newCardIds = useRef<Set<string>>(new Set());

  // Determine which cards are new before render
  newCardIds.current = new Set();
  const currentIds = new Set(cards.map(c => c.id));
  for (const card of cards) {
    if (!seenCardIds.current.has(card.id)) {
      newCardIds.current.add(card.id);
    }
  }

  // After render: add new cards, remove cards that left the field
  useEffect(() => {
    for (const id of newCardIds.current) {
      seenCardIds.current.add(id);
    }
    for (const id of seenCardIds.current) {
      if (!currentIds.has(id)) {
        seenCardIds.current.delete(id);
      }
    }
  });

  const fieldStyle = [
    styles.field,
    {
      backgroundColor: theme.fieldBackgroundColor || 'rgba(0, 0, 0, 0.1)',
      borderColor: theme.fieldBorderColor || 'rgba(255, 255, 255, 0.2)',
      borderWidth: theme.fieldBorderWidth || 1,
      borderRadius: theme.fieldBorderRadius || 8,
    },
  ];

  const cardSpacing = theme.cardSpacing ?? 12;

  const renderFieldBackground = () => {
    if (!theme.backgroundGradient) return null;

    return (
      <LinearGradient
        colors={theme.backgroundGradient.colors}
        start={theme.backgroundGradient.start}
        end={theme.backgroundGradient.end}
        style={styles.backgroundGradient}
      />
    );
  };

  const renderCard = (card: Card) => {
    const preview = previewDamage ? previewDamage(card) : null;
    const isSmall = cardSize === 'small';

    const previewBadgeStyle = [
      styles.previewBadgeBase,
      isSmall ? styles.previewBadgeSmall : styles.previewBadgeNormal,
    ];
    const previewTextStyle = [
      styles.previewTextBase,
      isSmall ? styles.previewTextSmall : styles.previewTextNormal,
      preview?.affinity && preview.affinity > 0 && { color: '#4ECDC4' },
      preview?.affinity && preview.affinity < 0 && { color: '#FF6B6B' },
    ];

    const extraCardProps = cardComponentProps?.(card) ?? {};

    const cardProps: React.ComponentProps<typeof CardComponent> = {
      card,
      size: cardSize,
      selected: selectedCardId === card.id,
      disabled,
      aiHighlight: aiHighlight?.(card.id) ?? null,
      damageAnimation: damageAnimation?.(card.id),
      entryAnimation: newCardIds.current.has(card.id),
      isRetiring: retiringCardId === card.id,
      playerEnergy,
      currentTurn,
      isFirstPlayer,
      onPress: onCardPress ? () => onCardPress(card) : undefined,
      ...(onAttack
        ? {
            onAttack: (attackName: string) => onAttack(card.id, attackName),
          }
        : {}),
      ...extraCardProps,
    };

    return (
      <View key={card.id} style={[styles.cardContainer, { marginRight: cardSpacing }]}> 
        <CardComponent {...cardProps} />

        {renderCardActions?.(card)}

        {attackMode && preview && position === 'top' && (
          <View style={previewBadgeStyle}>
            <Text style={previewTextStyle}>
              {preview.total}
              {preview.affinity
                ? ` (${preview.affinity > 0 ? '+' : ''}${preview.affinity})`
                : ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View ref={containerRef} style={styles.container}>
      {renderFieldBackground()}

      <View style={fieldStyle}>
        <Text style={styles.fieldLabel}>{label}</Text>

        <ScrollView
          horizontal
          style={styles.cardRow}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardRowContent}
        >
          {cards.length > 0 ? (
            cards.map(renderCard)
          ) : (
            <Text style={styles.emptyField}>{emptyLabel}</Text>
          )}
        </ScrollView>

        {theme.particleEffects && theme.particleEffects.length > 0 && (
          <View style={styles.particleContainer}>
            <BattlefieldParticles effects={theme.particleEffects} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 8,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  field: {
    padding: 12,
    minHeight: 120,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: Colors.text.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardRow: {
    flexDirection: 'row',
  },
  cardRowContent: {
    paddingHorizontal: 4,
    alignItems: 'center',
    minHeight: 80,
  },
  cardContainer: {
    position: 'relative',
  },
  emptyField: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: Colors.text.secondary,
    padding: 20,
    fontSize: 14,
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  previewBadgeBase: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  previewBadgeSmall: {
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewBadgeNormal: {
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  previewTextBase: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  previewTextSmall: {
    fontSize: 12,
  },
  previewTextNormal: {
    fontSize: 16,
  },
});
