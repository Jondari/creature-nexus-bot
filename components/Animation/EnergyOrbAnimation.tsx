import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface EnergyOrbAnimationProps {
  energyAmount: number;
  onComplete?: () => void;
  targetPosition?: { x: number; y: number };
  startPosition?: { x: number; y: number };
}

export const EnergyOrbAnimation: React.FC<EnergyOrbAnimationProps> = ({
  energyAmount,
  onComplete,
  targetPosition = { x: 50, y: 100 },
  startPosition = { x: Dimensions.get('window').width / 2, y: Dimensions.get('window').height - 150 }
}) => {
  const translateX = useRef(new Animated.Value(startPosition.x)).current;
  const translateY = useRef(new Animated.Value(startPosition.y)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: targetPosition.x,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: targetPosition.y,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.5,
          tension: 100,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
    ]);

    sequence.start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        opacity: opacityAnim,
        transform: [
          { translateX: translateX },
          { translateY: translateY },
          { scale: scaleAnim }
        ],
        zIndex: 1000,
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={{
          shadowColor: '#9D4EDD',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowAnim,
          shadowRadius: 25,
          elevation: 20,
        }}
      >
        <LinearGradient
          colors={['#9D4EDD', '#7209B7', '#480CA8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#FFFFFF40',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            +{energyAmount}
          </Text>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};