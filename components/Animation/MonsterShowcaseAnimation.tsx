import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, Platform, TouchableOpacity, Text } from 'react-native';
import { t } from '@/utils/i18n';

// Import monster images from different rarities
const PC_MONSTERS = [
  // Start with common monsters (4)
  require('@/assets/images/common/Barkyn.png'),
  require('@/assets/images/common/Glacis.png'),
  require('@/assets/images/common/Lumion.png'),
  require('@/assets/images/common/Zarel.png'),
  
  // Move to rare monsters (5)
  require('@/assets/images/rare/Ashion.png'),
  require('@/assets/images/rare/Cryel.png'),
  require('@/assets/images/rare/Solor.png'),
  require('@/assets/images/rare/Seleth.png'),
  require('@/assets/images/rare/Verdil.png'),
  
  // Epic monsters (5)
  require('@/assets/images/epic/Barkys.png'),
  require('@/assets/images/epic/Dralis.png'),
  require('@/assets/images/epic/Caelun.png'),
  require('@/assets/images/epic/Groan.png'),
  require('@/assets/images/epic/Nixeth.png'),

  // Finish with common monster (1)
  require('@/assets/images/common/Flareor.png'),
];

const MOBILE_MONSTERS = [
  // Epic full art monsters
  require('@/assets/images/epic/Barkys_full_art.png'),
  require('@/assets/images/epic/Caelun_full_art.png'),
  require('@/assets/images/epic/Dralis_full_art.png'),
  require('@/assets/images/epic/Groan_full_art.png'),
  require('@/assets/images/epic/Nixeth_full_art.png'),
  
  // Legendary monsters
  require('@/assets/images/legendary/Golrok.png'),
  require('@/assets/images/legendary/Selel.png'),
  require('@/assets/images/legendary/Solen.png'),
  require('@/assets/images/legendary/Stonelorn.png'),
  require('@/assets/images/legendary/Zephun.png'),
  
  // End with mythic monsters for dramatic finale
  require('@/assets/images/mythic/Mythanor.png'),
  require('@/assets/images/mythic/Mythelgorn.png'),
  require('@/assets/images/mythic/Mytholzak.png'),
  require('@/assets/images/mythic/Mythunden.png'),
  require('@/assets/images/mythic/Mythévor.png'), // Final frame
];

// Select monsters based on platform
const SHOWCASE_MONSTERS = Platform.OS === 'web' ? PC_MONSTERS : MOBILE_MONSTERS;

interface MonsterShowcaseAnimationProps {
  style?: any;
  transitionDuration?: number; // Duration each image is visible (ms)
  fadeDuration?: number; // Duration of fade transition (ms)
  autoStart?: boolean;
  fullScreen?: boolean; // Whether to display in full screen mode
  onAnimationComplete?: () => void;
  onSkip?: () => void; // Callback when skip button is pressed
}

const MonsterShowcaseAnimation: React.FC<MonsterShowcaseAnimationProps> = ({
  style,
  transitionDuration = 800,
  fadeDuration = 400,
  autoStart = true,
  fullScreen = false,
  onAnimationComplete,
  onSkip,
}) => {
  const [visibleImages, setVisibleImages] = useState<number[]>([]); // Array of visible image indices
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const [currentTransitionDuration, setCurrentTransitionDuration] = useState(transitionDuration);
  const overlayFadeAnim = useRef(new Animated.Value(1)).current;
  const containerFadeAnim = useRef(new Animated.Value(0)).current; // For fade-in/out effect
  
  // Create animated values for each monster (initialize once)
  const imageAnimations = useRef<Array<{opacity: Animated.Value, scale: Animated.Value}> | null>(null);
  if (imageAnimations.current === null) {
    imageAnimations.current = SHOWCASE_MONSTERS.map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.8),
    }));
  }
  const intervalRef = useRef<NodeJS.Timeout>();

  const handleSkip = () => {
    // Clear any running intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Stop current animation and hide immediately
    setIsAnimating(false);
    setAnimationComplete(true);
    setShouldHide(true);
    
    // Call the skip callback if provided
    if (onSkip) {
      onSkip();
    }
  };

  const startAnimation = () => {
    if (isAnimating || visibleImages.length >= SHOWCASE_MONSTERS.length) return;
    
    setIsAnimating(true);
    
    // Fade in the entire animation container first
    Animated.timing(containerFadeAnim, {
      toValue: 1,
      duration: fadeDuration * 2, // Longer fade-in for dramatic entrance
      useNativeDriver: true,
    }).start(() => {
      // Start the accelerating sequence
      animateSequence(0);
    });
  };

  const animateSequence = (imageIndex: number) => {
    if (imageIndex >= SHOWCASE_MONSTERS.length) {
      // Animation complete
      setIsAnimating(false);
      setAnimationComplete(true);
      
      // Wait a moment to show the final image, then start fade-out sequence
      setTimeout(() => {
        // First fade out the entire animation container
        Animated.timing(containerFadeAnim, {
          toValue: 0,
          duration: fadeDuration * 2, // Longer fade-out for dramatic exit
          useNativeDriver: true,
        }).start(() => {
          if (fullScreen) {
            // Then fade out the dark overlay
            Animated.timing(overlayFadeAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }).start(() => {
              // Hide the entire component after both fade out
              setTimeout(() => {
                setShouldHide(true);
              }, 200);
            });
          } else {
            // For non-fullscreen mode, just complete
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }
        });
      }, 1000); // Wait 1 seconds to appreciate the final image
      return;
    }

    // Add new image to visible images and manage stack size
    setVisibleImages(prev => {
      const newImages = [...prev, imageIndex];

      if (newImages.length > 2) {
        // Remove the last image
        return newImages.slice(1);
      }
      
      return newImages;
    });
    
    // Calculate accelerated duration - linear acceleration (0.5x speed)
    const progress = imageIndex / (SHOWCASE_MONSTERS.length - 1); // 0 to 1
    const accelerationFactor = progress; // Linear acceleration (simple progress)
    const currentDuration = (transitionDuration * 0.25) * (1 - accelerationFactor * 0.9); // 50% faster + 90% speed reduction at the end
    const minDuration = 25; // Minimum duration (halved)
    const actualDuration = Math.max(minDuration, currentDuration);
    
    // Animate new image in immediately
    Animated.parallel([
      Animated.timing(imageAnimations.current![imageIndex].opacity, {
        toValue: 1,
        duration: fadeDuration * 0.5, // Faster fade for smoother animation
        useNativeDriver: true,
      }),
      Animated.timing(imageAnimations.current![imageIndex].scale, {
        toValue: 1,
        duration: fadeDuration * 0.5,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Continue to next image after the calculated duration
      setTimeout(() => {
        animateSequence(imageIndex + 1);
      }, actualDuration);
    });
  };

  useEffect(() => {
    if (autoStart) {
      // Small delay before starting the animation
      const timer = setTimeout(() => {
        startAnimation();
      }, 500);

      return () => clearTimeout(timer);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoStart]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;
  const imageStyle = fullScreen ? styles.fullScreenImage : styles.monsterImage;
  const glowStyle = fullScreen ? styles.fullScreenGlowEffect : styles.glowEffect;

  // Hide the component completely after animation is done
  if (shouldHide) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        containerStyle, 
        style,
        {
          opacity: containerFadeAnim,
        }
      ]}
    >
      {/* Dark overlay background for full screen mode */}
      {fullScreen && (
        <Animated.View
          style={[
            styles.fullScreenOverlay,
            {
              opacity: overlayFadeAnim,
            },
          ]}
        />
      )}
      
      {/* Skip button - only show in fullscreen mode and while animating */}
      {fullScreen && !shouldHide && onSkip && (
        <Animated.View
          style={[
            styles.skipButtonContainer,
            {
              opacity: containerFadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* Render all visible images stacked on top of each other */}
      {visibleImages.map((imageIndex, stackIndex) => {
        // Safety check to ensure imageAnimations exists for this index
        const imageAnim = imageAnimations.current?.[imageIndex];
        if (!imageAnim) {
          return null;
        }
        
        return (
          <Animated.View
            key={`monster-${imageIndex}-${stackIndex}`} // Unique key combining both values
            style={[
              styles.imageContainer,
              fullScreen && styles.fullScreenImageContainer,
              {
                position: 'absolute',
                zIndex: stackIndex + 2, // Each new image has higher z-index
                opacity: imageAnim.opacity,
                transform: [
                  { scale: imageAnim.scale }
                ],
              },
            ]}
          >
            <Image
              source={SHOWCASE_MONSTERS[imageIndex]}
              style={imageStyle}
              resizeMode={fullScreen ? "cover" : "contain"}
            />
          </Animated.View>
        );
      })}
      
      {/* Subtle glow effect for the final mythic creature */}
      {visibleImages.length >= SHOWCASE_MONSTERS.length - 3 && (
        <Animated.View style={[glowStyle, { opacity: containerFadeAnim }]} />
      )}
    </Animated.View>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImageContainer: {
    width: screenWidth,
    height: screenHeight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  monsterImage: {
    width: Math.min(screenWidth * 0.6, 250),
    height: Math.min(screenWidth * 0.8, 320),
    borderRadius: 12,
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
    borderRadius: 0,
  },
  glowEffect: {
    position: 'absolute',
    width: Math.min(screenWidth * 0.65, 270),
    height: Math.min(screenWidth * 0.85, 340),
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // Golden glow
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    zIndex: -1,
  },
  fullScreenGlowEffect: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'rgba(255, 215, 0, 0.05)', // Subtle golden glow
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 8,
    zIndex: 1,
  },
  skipButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
  },
  skipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MonsterShowcaseAnimation;
