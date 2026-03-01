import React, { useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { Canvas, RoundedRect, vec, RadialGradient, Circle } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';

interface SkiaFlashOverlayProps {
  color: string;
  flashProgress: SharedValue<number>;
  particleProgress: SharedValue<number>;
  particleCount: number;
}

function generateParticles(count: number) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
    const distance = 20 + Math.random() * 30;
    particles.push({
      angle,
      distanceRatio: distance / 50, // normalized so we can scale to actual size later
      size: 3 + Math.random() * 4,
    });
  }
  return particles;
}

export default function SkiaFlashOverlay({ color, flashProgress, particleProgress, particleCount }: SkiaFlashOverlayProps) {
  const particles = React.useMemo(() => generateParticles(particleCount), [particleCount]);
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  const width = layout?.width ?? 0;
  const height = layout?.height ?? 0;
  const cx = width / 2;
  const cy = height / 2;
  // Scale particle spread to card size
  const spread = Math.min(width, height) * 0.4;

  return (
    <View style={styles.overlay} pointerEvents="none" onLayout={onLayout}>
      {layout && (
        <Canvas style={styles.canvas}>
          {/* Solid base layer for overall color tint */}
          <RoundedRect x={0} y={0} width={width} height={height} r={8} color={color} opacity={flashProgress} />
          {/* Radial gradient for brighter center */}
          <RoundedRect x={0} y={0} width={width} height={height} r={8} opacity={flashProgress}>
            <RadialGradient
              c={vec(cx, cy)}
              r={Math.max(width, height) * 0.5}
              colors={[`${color}FF`, `${color}00`]}
            />
          </RoundedRect>

          {particles.map((p, i) => {
            const dx = Math.cos(p.angle) * spread * p.distanceRatio;
            const dy = Math.sin(p.angle) * spread * p.distanceRatio;
            return (
              <Circle
                key={i}
                cx={cx + dx * particleProgress.value}
                cy={cy + dy * particleProgress.value}
                r={p.size}
                color={color}
                opacity={particleProgress.value > 0 ? 1 - particleProgress.value * 0.8 : 0}
              />
            );
          })}
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
