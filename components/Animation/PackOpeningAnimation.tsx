import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { Card } from '../../models/Card';
import { CardComponent } from '../CardComponent';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { t } from '@/utils/i18n';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

interface PackOpeningAnimationProps {
  cards: Card[];
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');

export default function PackOpeningAnimation({ cards, onComplete }: PackOpeningAnimationProps) {
  const backgroundOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.5);
  
  // Modal state for enlarged card view
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  
  // Pack-by-pack state
  const [currentPackIndex, setCurrentPackIndex] = useState(0);
  const totalPacks = Math.ceil(cards.length / 5);
  const currentPackCards = cards.slice(currentPackIndex * 5, (currentPackIndex + 1) * 5);
  
  useEffect(() => {
    // Start animation sequence
    backgroundOpacity.value = withTiming(1, { duration: 800 });
    
    // Animate title
    setTimeout(() => {
      titleOpacity.value = withTiming(1, { duration: 500 });
      titleScale.value = withTiming(1, { 
        duration: 800,
        easing: Easing.out(Easing.back(2))
      });
    }, 400);
    
    // Remove automatic onComplete - user will click Continue button
  }, []);
  
  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value
    };
  });
  
  const titleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ scale: titleScale.value }]
    };
  });
  
  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      <TouchableOpacity 
        style={styles.backgroundTouchable}
        onPress={onComplete}
        activeOpacity={1}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(18, 22, 38, 0.95)']}
          style={styles.background}
        />
      </TouchableOpacity>
      
      {/* Close button */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={onComplete}
        activeOpacity={0.7}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      {/* Content area that prevents touch propagation */}
      <TouchableOpacity 
        style={styles.contentWrapper}
        activeOpacity={1}
        onPress={() => {}} // Prevent touch propagation to background
      >
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.title}>
            {totalPacks === 1 
              ? t('packOpening.titleSingle')
              : t('packOpening.titleMulti', { index: String(currentPackIndex + 1), total: String(totalPacks) })}
          </Text>
          <Text style={styles.subtitle}>
            {totalPacks === 1 
              ? t('packOpening.subtitleSingle', { count: String(cards.length) })
              : t('packOpening.subtitleMulti', { count: String(currentPackCards.length) })}
          </Text>
        </Animated.View>
        
        <View style={styles.cardsContainer}>
          {/* First row - 3 cards */}
          <View style={styles.cardRow}>
            {currentPackCards.slice(0, 3).map((card, index) => (
              <CardComponent
                key={card.id}
                card={card}
                viewMode="collection"
                showAnimation={true}
                index={index}
                size="small"
                onPress={() => setSelectedCard(card)}
              />
            ))}
          </View>
          
          {/* Second row - 2 cards */}
          <View style={styles.cardRow}>
            {currentPackCards.slice(3, 5).map((card, index) => (
              <CardComponent
                key={card.id}
                card={card}
                viewMode="collection"
                showAnimation={true}
                index={index + 3} // Continue animation sequence
                size="small"
                onPress={() => setSelectedCard(card)}
              />
            ))}
          </View>
        </View>
        
        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={() => {
              if (currentPackIndex < totalPacks - 1) {
                // Go to next pack
                setCurrentPackIndex(currentPackIndex + 1);
              } else {
                // Last pack, complete the animation
                onComplete();
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.accent[700], Colors.accent[500]]}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.continueButtonText}>
                {totalPacks === 1 
                  ? t('common.continue') 
                  : (currentPackIndex < totalPacks - 1 ? t('common.continue') : t('common.complete'))}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Skip All button - only show if there are more packs */}
          {totalPacks > 1 && currentPackIndex < totalPacks - 1 && (
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={onComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>{t('common.skipAll')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Card Detail Modal */}
      <Modal
        visible={selectedCard !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedCard(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={() => setSelectedCard(null)}
            activeOpacity={1}
          />
          {selectedCard && (
            <View style={styles.modalContent}>
              <CardComponent
                card={selectedCard}
                viewMode="collection"
                size="normal"
              />
            </View>
          )}
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.accent[300],
    marginBottom: 20,
  },
  cardsContainer: {
    alignItems: 'center',
    gap: 15,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  continueButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  continueButtonGradient: {
    paddingHorizontal: 30, // Smaller button
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: Colors.text.primary,
    fontSize: 16, // Smaller text
    fontWeight: 'bold',
  },
  skipButtonText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 101,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
