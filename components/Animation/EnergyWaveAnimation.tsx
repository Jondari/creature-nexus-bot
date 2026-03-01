import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from '@/utils/i18n';

interface EnergyWaveAnimationProps {
  energyAmount: number;
  onComplete?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const EnergyWaveAnimation: React.FC<EnergyWaveAnimationProps> = ({
  energyAmount,
  onComplete
}) => {
  const waveScale = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0.8)).current;
  const textScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    const textAnimation = Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(textScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textRotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);

    Animated.parallel([waveAnimation, textAnimation]).start(() => {
      onComplete?.();
    });
  }, []);

  const rotation = textRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: screenWidth,
          height: screenWidth,
          opacity: waveOpacity,
          transform: [{ scale: waveScale }],
        }}
      >
        <LinearGradient
          colors={['transparent', '#00FF9F40', '#00FF9F20', 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: screenWidth / 2,
            borderWidth: 2,
            borderColor: '#00FF9F',
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [
            { scale: textScale },
            { rotate: rotation }
          ],
          backgroundColor: 'rgba(0, 255, 159, 0.1)',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 25,
          borderWidth: 2,
          borderColor: '#00FF9F',
          shadowColor: '#00FF9F',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 15,
          elevation: 10,
        }}
      >
        <Text
          style={{
            color: '#00FF9F',
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            textShadowColor: 'rgba(0, 255, 159, 0.5)',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
          }}
        >
          {t(
            energyAmount > 1 ? 'animations.energyGainPlural' : 'animations.energyGain',
            { amount: String(energyAmount) }
          )}
        </Text>
      </Animated.View>
    </View>
  );
};
