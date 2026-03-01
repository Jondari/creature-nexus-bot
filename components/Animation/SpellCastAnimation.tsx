import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardComponent } from '../CardComponent';
import { Card } from '../../types/game';

interface SpellCastAnimationProps {
  spell: Card;
  startPosition: { x: number; y: number };
  onComplete?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const centerX = screenWidth / 2;
const centerY = screenHeight / 2;

export const SpellCastAnimation: React.FC<SpellCastAnimationProps> = ({
  spell,
  startPosition,
  onComplete
}) => {
  const cardPosition = useRef(new Animated.ValueXY(startPosition)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  
  const waveScale = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const cardAnimation = Animated.sequence([
      // Phase 1: Move card to center and scale up slightly
      Animated.parallel([
        Animated.timing(cardPosition, {
          toValue: { x: centerX - 80, y: centerY - 120 }, // Offset for card size
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(cardScale, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Phase 2: Brief pause and pulse
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      
      // Phase 3: Fade out card
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    const waveAnimation = Animated.parallel([
      Animated.timing(waveScale, {
        toValue: 3,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(waveOpacity, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([
      cardAnimation,
      Animated.sequence([
        Animated.delay(1000), // Start wave after card animation
        waveAnimation,
      ]),
    ]).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
      pointerEvents="none"
    >
      {/* Animated Card */}
      <Animated.View
        style={{
          position: 'absolute',
          left: cardPosition.x,
          top: cardPosition.y,
          opacity: cardOpacity,
          transform: [{ scale: cardScale }],
          zIndex: 1001,
        }}
      >
        <CardComponent
          card={spell}
          size="normal"
          viewMode="battle"
          disabled={true}
        />
      </Animated.View>

      {/* Spell Wave Effect */}
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          left: centerX - screenWidth / 2,
          top: centerY - screenWidth / 2,
          zIndex: 999,
        }}
      >
        <Animated.View
          style={{
            width: screenWidth,
            height: screenWidth,
            opacity: waveOpacity,
            transform: [{ scale: waveScale }],
          }}
        >
          <LinearGradient
            colors={['transparent', '#9945FF40', '#9945FF20', 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: screenWidth / 2,
              borderWidth: 2,
              borderColor: '#9945FF',
            }}
          />
        </Animated.View>
      </View>

    </View>
  );
};
