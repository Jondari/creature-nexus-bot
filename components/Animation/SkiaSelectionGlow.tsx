import React, { useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { Canvas, RoundedRect, Paint, BlurMask } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

interface SkiaSelectionGlowProps {
  color: string;
  isActive: boolean;
  borderRadius?: number;
}

export function SkiaSelectionGlow({ color, isActive, borderRadius = 8 }: SkiaSelectionGlowProps) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);

  const pulse = useSharedValue(0.3);

  React.useEffect(() => {
    if (isActive) {
      pulse.value = 0.3;
      pulse.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulse.value = 0;
    }
  }, [isActive]);

  const glowOpacity = useDerivedValue(() => pulse.value * 0.9);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  if (!isActive) return null;

  // Enough padding for the blur to spread without clipping
  const pad = 16;

  return (
    <View style={styles.overlay} pointerEvents="none" onLayout={onLayout}>
      {layout && (
        <View style={[styles.canvasContainer, { top: -pad, left: -pad, right: -pad, bottom: -pad }]}>
          <Canvas style={styles.canvas}>
            {/* Single blurred stroke — produces a smooth, diffused glow */}
            <RoundedRect
              x={pad}
              y={pad}
              width={layout.width}
              height={layout.height}
              r={borderRadius}
            >
              <Paint color={color} style="stroke" strokeWidth={3} opacity={glowOpacity}>
                <BlurMask blur={6} style="normal" />
              </Paint>
            </RoundedRect>
          </Canvas>
        </View>
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
    zIndex: -1,
    overflow: 'visible',
  },
  canvasContainer: {
    position: 'absolute',
  },
  canvas: {
    flex: 1,
  },
});
