import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { formatTimeRemaining } from '../utils/cardUtils';
import Colors from '../constants/Colors';
import { t } from '@/utils/i18n';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface CountdownTimerProps {
  timeRemaining: number;
  onComplete?: () => void;
}

export default function CountdownTimer({ timeRemaining, onComplete }: CountdownTimerProps) {
  const [remainingTime, setRemainingTime] = useState(timeRemaining);
  const progress = useSharedValue(0);
  
  useEffect(() => {
    setRemainingTime(timeRemaining);
    progress.value = 0;
    
    // Set the initial progress based on time remaining
    if (timeRemaining > 0) {
      const totalTime = 12 * 60 * 60 * 1000; // 12 hours in ms
      const elapsed = totalTime - timeRemaining;
      const initialProgress = Math.max(0, Math.min(1, elapsed / totalTime));
      progress.value = withTiming(initialProgress, { duration: 500 });
    } else {
      progress.value = withTiming(1, { duration: 500 });
    }
  }, [timeRemaining]);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          const newTime = Math.max(0, prev - 1000);
          
          // Update progress bar
          const totalTime = 12 * 60 * 60 * 1000; // 12 hours
          const elapsed = totalTime - newTime;
          const newProgress = Math.max(0, Math.min(1, elapsed / totalTime));
          progress.value = withTiming(newProgress, { duration: 500 });
          
          if (newTime === 0 && onComplete) {
            onComplete();
          }
          
          return newTime;
        });
      }, 1000);
    } else if (onComplete) {
      onComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [remainingTime, onComplete]);
  
  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.nextPack.title')}</Text>
      <Text style={styles.timer}>{formatTimeRemaining(remainingTime)}</Text>
      
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, progressBarStyle]} />
      </View>
      
      <Text style={styles.hint}>
        {remainingTime > 0 
          ? t('home.nextPack.comeBack')
          : t('home.nextPack.ready')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    width: '90%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  timer: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.accent[500],
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    width: '100%',
    backgroundColor: Colors.background.primary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent[500],
  },
  hint: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  }
});
