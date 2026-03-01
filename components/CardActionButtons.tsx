import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, X, Zap } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';
import { Card } from '../types/game';
import { isSpellCard } from '../models/cards-extended';

interface CardActionButtonsProps {
  visible: boolean;
  showPlay?: boolean;
  showRetire?: boolean;
  onPlay?: () => void;
  onRetire?: () => void;
  cardSize?: 'small' | 'normal';
  card?: Card; // Optional card to determine spell vs monster
}

export function CardActionButtons({
  visible,
  showPlay = false,
  showRetire = false,
  onPlay,
  onRetire,
  cardSize = 'normal',
  card,
}: CardActionButtonsProps) {
  if (!visible) {
    return null;
  }

  const isSmall = cardSize === 'small';
  const buttonStyle = [
    styles.actionButton,
    isSmall ? styles.actionButtonSmall : styles.actionButtonNormal,
  ];
  const textStyle = [
    styles.actionText,
    isSmall ? styles.actionTextSmall : styles.actionTextNormal,
  ];
  const iconSize = isSmall ? 14 : 18;
  
  // Determine if card is a spell to show appropriate button text and icon
  const isSpell = card && isSpellCard(card);
  const playButtonText = isSpell ? t('actions.cast') : t('actions.play');
  const PlayIcon = isSpell ? Zap : Play;

  return (
    <View style={[styles.container, isSmall ? styles.containerSmall : styles.containerNormal]}>
      {showPlay && (
        <TouchableOpacity
          style={buttonStyle}
          onPress={onPlay}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isSpell ? [Colors.accent[600], Colors.accent[500]] : [Colors.primary[600], Colors.primary[500]]}
            style={styles.buttonGradient}
          >
            <PlayIcon size={iconSize} color={Colors.text.primary} />
            <Text style={textStyle}>{playButtonText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      {showRetire && (
        <TouchableOpacity
          style={buttonStyle}
          onPress={onRetire}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.neutral[600], Colors.neutral[500]]}
            style={styles.buttonGradient}
          >
            <X size={iconSize} color={Colors.text.primary} />
            <Text style={textStyle}>{t('actions.retire')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
    opacity: 0.85,
  },
  containerSmall: {
    top: 4,
    left: 4,
    right: 4,
    gap: 4,
  },
  containerNormal: {
    top: 8,
    left: 8,
    right: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButtonSmall: {
    minHeight: 28,
  },
  actionButtonNormal: {
    minHeight: 36,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  actionText: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  actionTextSmall: {
    fontSize: 10,
  },
  actionTextNormal: {
    fontSize: 12,
  },
});
