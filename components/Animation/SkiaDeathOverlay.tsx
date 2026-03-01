import React, { useState, useMemo } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { Canvas, RoundedRect, Circle, vec, LinearGradient } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { Element } from '../../types/game';

// Element-specific death colors
const DEATH_COLORS: Record<string, { primary: string; secondary: string }> = {
  fire: { primary: '#FF4500', secondary: '#FF8C00' },
  water: { primary: '#1E90FF', secondary: '#87CEEB' },
  earth: { primary: '#8B4513', secondary: '#D2691E' },
  air: { primary: '#E0E0E0', secondary: '#FFFFFF' },
};

const DEFAULT_DEATH_COLORS = { primary: '#FF0000', secondary: '#FF6347' };

function getDeathColors(element?: Element) {
  if (element && element !== 'all') return DEATH_COLORS[element] || DEFAULT_DEATH_COLORS;
  return DEFAULT_DEATH_COLORS;
}

interface SkiaDeathOverlayProps {
  progress: SharedValue<number>; // 0→1 over the dissolve duration
  attackElement?: Element;
}

interface DissolveParticleData {
  x: number;
  y: number;
  startAt: number;
  maxRadiusRatio: number;
}

interface DebrisParticleData {
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  size: number;
  startAt: number;
}

// Sub-component so useDerivedValue is called at component level (not in a loop)
function DissolveCircle({ data, progress, width, height, spread, color }: {
  data: DissolveParticleData;
  progress: SharedValue<number>;
  width: number;
  height: number;
  spread: number;
  color: string;
}) {
  const r = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    return local * data.maxRadiusRatio * spread;
  });
  const opacity = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    return Math.min(local * 2, 1) * 0.8;
  });

  return (
    <Circle
      cx={data.x * width}
      cy={data.y * height}
      r={r}
      color={color}
      opacity={opacity}
    />
  );
}

// Sub-component for flying debris
function DebrisCircle({ data, progress, width, height, color }: {
  data: DebrisParticleData;
  progress: SharedValue<number>;
  width: number;
  height: number;
  color: string;
}) {
  const cx = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return data.startX * width;
    const local = (p - data.startAt) / (1 - data.startAt);
    return (data.startX + data.dx * local) * width;
  });
  const cy = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return data.startY * height;
    const local = (p - data.startAt) / (1 - data.startAt);
    return (data.startY + data.dy * local) * height;
  });
  const opacity = useDerivedValue(() => {
    const p = progress.value;
    if (p < data.startAt) return 0;
    const local = (p - data.startAt) / (1 - data.startAt);
    if (local > 0.7) return (1 - local) / 0.3;
    return 1;
  });

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={data.size}
      color={color}
      opacity={opacity}
    />
  );
}

function generateDissolveParticles(count: number): DissolveParticleData[] {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      startAt: Math.random() * 0.5,
      maxRadiusRatio: 0.04 + Math.random() * 0.08,
    });
  }
  return particles;
}

function generateDebrisParticles(count: number): DebrisParticleData[] {
  const debris = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    debris.push({
      startX: 0.2 + Math.random() * 0.6,
      startY: 0.2 + Math.random() * 0.6,
      dx: Math.cos(angle) * (0.3 + Math.random() * 0.7) * 0.4,
      dy: Math.sin(angle) * (0.3 + Math.random() * 0.7) * 0.4,
      size: 2 + Math.random() * 3,
      startAt: 0.1 + Math.random() * 0.4,
    });
  }
  return debris;
}

export default function SkiaDeathOverlay({ progress, attackElement }: SkiaDeathOverlayProps) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);
  const colors = useMemo(() => getDeathColors(attackElement), [attackElement]);
  const dissolveParticles = useMemo(() => generateDissolveParticles(30), []);
  const debrisParticles = useMemo(() => generateDebrisParticles(16), []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  const overlayOpacity = useDerivedValue(() => {
    const p = progress.value;
    if (p < 0.1) return p * 10;
    return 1;
  });

  const width = layout?.width ?? 0;
  const height = layout?.height ?? 0;
  const spread = Math.min(width, height);

  return (
    <View style={styles.overlay} pointerEvents="none" onLayout={onLayout}>
      {layout && (
        <Canvas style={styles.canvas}>
          {/* Darkening veil */}
          <RoundedRect
            x={0} y={0}
            width={width} height={height}
            r={8}
            opacity={overlayOpacity}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={[`${colors.primary}CC`, `${colors.secondary}88`, '#00000066']}
            />
          </RoundedRect>

          {/* Dissolve circles that grow across the card */}
          {dissolveParticles.map((p, i) => (
            <DissolveCircle
              key={`d-${i}`}
              data={p}
              progress={progress}
              width={width}
              height={height}
              spread={spread}
              color={colors.primary}
            />
          ))}

          {/* Flying debris particles */}
          {debrisParticles.map((d, i) => (
            <DebrisCircle
              key={`e-${i}`}
              data={d}
              progress={progress}
              width={width}
              height={height}
              color={colors.secondary}
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
