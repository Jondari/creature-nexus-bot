import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Line, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { Element } from '../../types/game';

// Element color palettes for attack effects
const ATTACK_COLORS: Record<string, { primary: string; secondary: string }> = {
  fire: { primary: '#FF4500', secondary: '#FFD700' },
  water: { primary: '#1E90FF', secondary: '#87CEEB' },
  earth: { primary: '#8B4513', secondary: '#2E8B57' },
  air: { primary: '#E0E0E0', secondary: '#00CED1' },
};

const DEFAULT_COLORS = { primary: '#FFFFFF', secondary: '#CCCCCC' };

function getAttackColors(element?: Element) {
  if (element && element !== 'all') return ATTACK_COLORS[element] || DEFAULT_COLORS;
  return DEFAULT_COLORS;
}

// --- Particle data types ---

interface FireRayData {
  angle: number;
  length: number;
  width: number;
  startAt: number;
}

interface WaterRingData {
  radiusRatio: number;
  startAt: number;
  strokeWidth: number;
}

interface EarthShardData {
  angle: number;
  length: number;
  startX: number;
  startAt: number;
}

interface AirTrailData {
  angle: number;
  radius: number;
  spin: number;
  startAt: number;
}

// --- Sub-components (one useDerivedValue per particle) ---

function FireRay({ data, progress, cx, cy, spread, color }: {
  data: FireRayData;
  progress: SharedValue<number>;
  cx: number;
  cy: number;
  spread: number;
  color: string;
}) {
  const len = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    return local * data.length * spread;
  });
  const opacity = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    if (local > 0.6) return (1 - local) / 0.4;
    return 1;
  });

  const dx = Math.cos(data.angle);
  const dy = Math.sin(data.angle);

  return (
    <Line
      p1={vec(cx, cy)}
      p2={vec(cx + dx * (len.value || 0), cy + dy * (len.value || 0))}
      color={color}
      strokeWidth={data.width}
      opacity={opacity}
    />
  );
}

function WaterRing({ data, progress, cx, cy, spread, color }: {
  data: WaterRingData;
  progress: SharedValue<number>;
  cx: number;
  cy: number;
  spread: number;
  color: string;
}) {
  const r = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    return local * data.radiusRatio * spread;
  });
  const opacity = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    if (local > 0.5) return (1 - local) / 0.5;
    return 0.8;
  });

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={r}
      color={color}
      opacity={opacity}
      style="stroke"
      strokeWidth={data.strokeWidth}
    />
  );
}

function EarthShard({ data, progress, cy, spread, color }: {
  data: EarthShardData;
  progress: SharedValue<number>;
  cy: number;
  spread: number;
  color: string;
}) {
  const yOffset = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    return local * data.length * spread;
  });
  const opacity = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    if (local > 0.7) return (1 - local) / 0.3;
    return 1;
  });

  const dx = Math.cos(data.angle);
  const dy = Math.sin(data.angle);

  return (
    <Line
      p1={vec(data.startX, cy)}
      p2={vec(data.startX + dx * spread * 0.2, cy - (yOffset.value || 0) + dy * spread * 0.15)}
      color={color}
      strokeWidth={3}
      opacity={opacity}
    />
  );
}

function AirTrail({ data, progress, cx, cy, spread, color }: {
  data: AirTrailData;
  progress: SharedValue<number>;
  cx: number;
  cy: number;
  spread: number;
  color: string;
}) {
  const animAngle = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return data.angle;
    const local = (p - data.startAt) / (1 - data.startAt);
    return data.angle + local * data.spin;
  });
  const r = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    return local * data.radius * spread;
  });
  const opacity = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    if (local > 0.6) return (1 - local) / 0.4;
    return 0.9;
  });

  return (
    <Circle
      cx={cx + Math.cos(animAngle.value || 0) * (r.value || 0)}
      cy={cy + Math.sin(animAngle.value || 0) * (r.value || 0)}
      r={3}
      color={color}
      opacity={opacity}
    />
  );
}

// --- Particle generators ---

function generateFireRays(count: number): FireRayData[] {
  const rays = [];
  for (let i = 0; i < count; i++) {
    rays.push({
      angle: (i / count) * Math.PI * 2 + (Math.random() * 0.3 - 0.15),
      length: 0.5 + Math.random() * 0.5,
      width: 2 + Math.random() * 3,
      startAt: Math.random() * 0.2,
    });
  }
  return rays;
}

function generateWaterRings(count: number): WaterRingData[] {
  const rings = [];
  for (let i = 0; i < count; i++) {
    rings.push({
      radiusRatio: 0.3 + (i / count) * 0.7,
      startAt: i * 0.15,
      strokeWidth: 2 + Math.random() * 2,
    });
  }
  return rings;
}

function generateEarthShards(count: number, width: number): EarthShardData[] {
  const shards = [];
  for (let i = 0; i < count; i++) {
    shards.push({
      angle: -Math.PI / 2 + (Math.random() * 0.8 - 0.4),
      length: 0.4 + Math.random() * 0.6,
      startX: width * (0.1 + Math.random() * 0.8),
      startAt: Math.random() * 0.3,
    });
  }
  return shards;
}

function generateAirTrails(count: number): AirTrailData[] {
  const trails = [];
  for (let i = 0; i < count; i++) {
    trails.push({
      angle: (i / count) * Math.PI * 2,
      radius: 0.3 + Math.random() * 0.7,
      spin: Math.PI * (1 + Math.random()),
      startAt: Math.random() * 0.2,
    });
  }
  return trails;
}

// --- Main component ---

interface SkiaAttackEffectProps {
  progress: SharedValue<number>;
  attackElement?: Element;
}

export default function SkiaAttackEffect({ progress, attackElement }: SkiaAttackEffectProps) {
  const [layout, setLayout] = React.useState<{ width: number; height: number } | null>(null);
  const colors = useMemo(() => getAttackColors(attackElement), [attackElement]);

  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setLayout({ width, height });
  };

  const width = layout?.width ?? 0;
  const height = layout?.height ?? 0;
  const cx = width / 2;
  const cy = height / 2;
  const spread = Math.min(width, height) * 0.5;

  // Generate particles based on element (memoized)
  const fireRays = useMemo(() => attackElement === 'fire' ? generateFireRays(12) : [], [attackElement]);
  const waterRings = useMemo(() => attackElement === 'water' ? generateWaterRings(4) : [], [attackElement]);
  const earthShards = useMemo(() => attackElement === 'earth' ? generateEarthShards(10, width) : [], [attackElement, width]);
  const airTrails = useMemo(() => attackElement === 'air' ? generateAirTrails(16) : [], [attackElement]);

  return (
    <View style={styles.overlay} pointerEvents="none" onLayout={onLayout}>
      {layout && (
        <Canvas style={styles.canvas}>
          {attackElement === 'fire' && fireRays.map((ray, i) => (
            <FireRay
              key={`f-${i}`}
              data={ray}
              progress={progress}
              cx={cx}
              cy={cy}
              spread={spread}
              color={i % 2 === 0 ? colors.primary : colors.secondary}
            />
          ))}

          {attackElement === 'water' && waterRings.map((ring, i) => (
            <WaterRing
              key={`w-${i}`}
              data={ring}
              progress={progress}
              cx={cx}
              cy={cy}
              spread={spread}
              color={i % 2 === 0 ? colors.primary : colors.secondary}
            />
          ))}

          {attackElement === 'earth' && earthShards.map((shard, i) => (
            <EarthShard
              key={`e-${i}`}
              data={shard}
              progress={progress}
              cy={height}
              spread={spread}
              color={i % 2 === 0 ? colors.primary : colors.secondary}
            />
          ))}

          {attackElement === 'air' && airTrails.map((trail, i) => (
            <AirTrail
              key={`a-${i}`}
              data={trail}
              progress={progress}
              cx={cx}
              cy={cy}
              spread={spread}
              color={i % 2 === 0 ? colors.primary : colors.secondary}
            />
          ))}
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
});
