import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { BattlefieldTheme } from '@/types/battlefield';

type ParticleEffectConfig = NonNullable<BattlefieldTheme['particleEffects']>[number];

interface BattlefieldParticlesProps {
  effects?: ParticleEffectConfig[];
}

const MAX_PARTICLES = 20;

interface BaseParticleConfig {
  id: string;
  leftPercent: number;
  baseDelay: number;
  duration: number;
}

interface FloatingParticleConfig extends BaseParticleConfig {
  size: number;
  verticalTravel: number;
  horizontalDrift: number;
}

interface SparkParticleConfig extends BaseParticleConfig {
  size: number;
  bottomPercent: number;
}

interface SmokeParticleConfig extends BaseParticleConfig {
  size: number;
  maxOpacity: number;
  verticalTravel: number;
}

interface EnergyParticleConfig extends BaseParticleConfig {
  size: number;
  bottomPercent: number;
}

const generateFloatingParticles = (count: number): FloatingParticleConfig[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: `floating-${index}`,
    leftPercent: Math.random() * 100,
    size: 8 + Math.random() * 6,
    verticalTravel: 40 + Math.random() * 40,
    horizontalDrift: (Math.random() - 0.5) * 20,
    baseDelay: Math.random() * 1500,
    duration: 4000 + Math.random() * 3000,
  }));
};

const generateSparkParticles = (count: number): SparkParticleConfig[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: `spark-${index}`,
    leftPercent: Math.random() * 100,
    size: 4 + Math.random() * 4,
    baseDelay: Math.random() * 600,
    duration: 800 + Math.random() * 400,
    bottomPercent: 10 + Math.random() * 70,
  }));
};

const generateSmokeParticles = (count: number): SmokeParticleConfig[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: `smoke-${index}`,
    leftPercent: Math.random() * 100,
    size: 60 + Math.random() * 40,
    maxOpacity: 0.12 + Math.random() * 0.12,
    verticalTravel: 30 + Math.random() * 20,
    baseDelay: Math.random() * 2000,
    duration: 5000 + Math.random() * 4000,
  }));
};

const generateEnergyParticles = (count: number): EnergyParticleConfig[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: `energy-${index}`,
    leftPercent: 20 + Math.random() * 60,
    size: 40 + Math.random() * 20,
    baseDelay: Math.random() * 1200,
    duration: 2200 + Math.random() * 1200,
    bottomPercent: 10 + Math.random() * 60,
  }));
};

const FloatingParticlesLayer = ({
  color,
  density,
}: {
  color: string;
  density: number;
}) => {
  const particles = useMemo(() => generateFloatingParticles(Math.min(density, MAX_PARTICLES)), [density]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} config={particle} color={color} />
      ))}
    </View>
  );
};

const FloatingParticle = ({
  config,
  color,
}: {
  config: FloatingParticleConfig;
  color: string;
}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      config.baseDelay,
      withRepeat(
        withTiming(1, {
          duration: config.duration,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }, [config.baseDelay, config.duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = -config.verticalTravel * progress.value;
    const translateX = config.horizontalDrift * progress.value;
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 1, 0]);

    return {
      transform: [{ translateY }, { translateX }],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatingParticle,
        {
          left: `${config.leftPercent}%`,
          bottom: -10,
          width: config.size,
          height: config.size,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const SparksLayer = ({ color, density }: { color: string; density: number }) => {
  const particles = useMemo(() => generateSparkParticles(Math.min(density, MAX_PARTICLES)), [density]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <SparkParticle key={particle.id} config={particle} color={color} />
      ))}
    </View>
  );
};

const SparkParticle = ({
  config,
  color,
}: {
  config: SparkParticleConfig;
  color: string;
}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      config.baseDelay,
      withRepeat(
        withTiming(1, {
          duration: config.duration,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false,
      ),
    );
  }, [config.baseDelay, config.duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.2, 0.6, 1], [0.2, 1.2, 0.8, 0]);
    const opacity = interpolate(progress.value, [0, 0.3, 0.6, 1], [0, 1, 0.5, 0]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sparkParticle,
        {
          left: `${config.leftPercent}%`,
          bottom: `${config.bottomPercent}%`,
          width: config.size,
          height: config.size,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const SmokeLayer = ({ color, density }: { color: string; density: number }) => {
  const particles = useMemo(() => generateSmokeParticles(Math.min(density, MAX_PARTICLES)), [density]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <SmokeParticle key={particle.id} config={particle} color={color} />
      ))}
    </View>
  );
};

const SmokeParticle = ({
  config,
  color,
}: {
  config: SmokeParticleConfig;
  color: string;
}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      config.baseDelay,
      withRepeat(
        withTiming(1, {
          duration: config.duration,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        false,
      ),
    );
  }, [config.baseDelay, config.duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = -config.verticalTravel * progress.value;
    const opacity = interpolate(progress.value, [0, 0.3, 0.7, 1], [0, config.maxOpacity, config.maxOpacity, 0]);
    const scale = interpolate(progress.value, [0, 1], [0.6, 1.2]);

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.smokeParticle,
        {
          left: `${config.leftPercent}%`,
          bottom: -20,
          width: config.size,
          height: config.size,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const EnergyLayer = ({ color, density }: { color: string; density: number }) => {
  const particles = useMemo(() => generateEnergyParticles(Math.min(density, MAX_PARTICLES)), [density]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <EnergyParticle key={particle.id} config={particle} color={color} />
      ))}
    </View>
  );
};

const EnergyParticle = ({
  config,
  color,
}: {
  config: EnergyParticleConfig;
  color: string;
}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      config.baseDelay,
      withRepeat(
        withTiming(1, {
          duration: config.duration,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }, [config.baseDelay, config.duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.4, 1, 0.4]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.8, 0]);
    const rotate = `${progress.value * 360}deg`;

    return {
      transform: [{ rotate }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.energyParticle,
        {
          left: `${config.leftPercent}%`,
          bottom: `${config.bottomPercent}%`,
          width: config.size,
          height: config.size,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

export const BattlefieldParticles: React.FC<BattlefieldParticlesProps> = ({ effects }) => {
  if (!effects || effects.length === 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {effects.map((effect, index) => {
        const density = Math.max(0, effect.density || 0);

        if (density === 0) {
          return null;
        }

        switch (effect.type) {
          case 'sparks':
            return <SparksLayer key={`${effect.type}-${index}`} color={effect.color} density={density} />;
          case 'smoke':
            return <SmokeLayer key={`${effect.type}-${index}`} color={effect.color} density={density} />;
          case 'energy':
            return <EnergyLayer key={`${effect.type}-${index}`} color={effect.color} density={density} />;
          case 'floating':
          default:
            return <FloatingParticlesLayer key={`${effect.type}-${index}`} color={effect.color} density={density} />;
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  floatingParticle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0,
  },
  sparkParticle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  smokeParticle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0,
  },
  energyParticle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    opacity: 0,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
