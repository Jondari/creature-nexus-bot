import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { Card } from '@/types/game';
import { ExtendedCard } from '@/models/cards-extended';
import { CardComponent } from '@/components/CardComponent';
import { BoosterPack } from '@/models/BoosterPack';
import { Coins } from 'lucide-react-native';
import { t } from '@/utils/i18n';

type RewardType = 'card' | 'pack' | 'coins';

interface RewardAnimationProps {
  type: RewardType;
  message: string;
  card?: Card | ExtendedCard; // when type === 'card'
  pack?: BoosterPack; // when type === 'pack'
  coins?: number; // when type === 'coins'
  onComplete?: () => void;
  durationMs?: number;
}

export const RewardAnimation: React.FC<RewardAnimationProps> = ({
  type,
  message,
  card,
  pack,
  coins,
  onComplete,
  durationMs = 1600,
}) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.7)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(contentScale, { toValue: 1, useNativeDriver: true }),
      ]),
      Animated.delay(Math.max(600, durationMs - 450)),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start(() => onComplete?.());
  }, [durationMs, onComplete, overlayOpacity, contentOpacity, contentScale]);

  const renderVisual = () => {
    switch (type) {
      case 'card':
        return card ? (
          <CardComponent card={card} size="normal" viewMode="battle" disabled />
        ) : null;
      case 'pack': {
        return (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {pack?.imageUrl ? (
              <Image
                source={pack.imageUrl as any}
                style={{ width: 180, height: 140 }}
                resizeMode="contain"
                onError={(e) => {
                  if (__DEV__) {
                    console.log('RewardAnimation pack image failed:', pack?.imageUrl, e.nativeEvent?.error);
                  }
                }}
              />
            ) : (
              <LinearGradient
                colors={[Colors.primary[700], Colors.primary[900]] as any}
                style={{ width: 180, height: 120, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: Colors.text.primary, fontFamily: 'Poppins-Bold' }}>
                  {pack?.name || t('demo.animation.genericPack')}
                </Text>
              </LinearGradient>
            )}
            {pack?.name ? (
              <Text style={{ color: Colors.text.primary, marginTop: 8, fontFamily: 'Inter-Medium' }}>{pack.name}</Text>
            ) : null}
          </View>
        );
      }
      case 'coins':
        return (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <LinearGradient
              colors={["#FFD54F", "#FFA000"]}
              style={{ width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' }}
            >
              <Coins color="#6b4f00" size={48} />
            </LinearGradient>
            <Text style={{ color: Colors.text.primary, marginTop: 10, fontFamily: 'Poppins-Bold', fontSize: 18 }}>
              +{coins || 0}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        opacity: overlayOpacity,
      }}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.6)"]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: contentScale }],
            opacity: contentOpacity,
          }}
        >
          <Text style={{ color: Colors.text.primary, fontFamily: 'Poppins-Bold', fontSize: 22, marginBottom: 12 }}>
            {message}
          </Text>
          {renderVisual()}
        </Animated.View>
      </View>
    </Animated.View>
  );
};
