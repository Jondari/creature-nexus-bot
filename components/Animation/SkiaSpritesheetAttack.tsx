import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Image, useImage, Skia, Group } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { Element } from '../../types/game';
import { ATTACK_SPRITESHEETS, SPRITESHEET_COLUMNS } from './attackSprites';

interface Props {
  progress: SharedValue<number>;
  attackElement: Exclude<Element, 'all'>;
}

export default function SkiaSpritesheetAttack({ progress, attackElement }: Props) {
  const [layout, setLayout] = React.useState<{ width: number; height: number } | null>(null);
  const source = ATTACK_SPRITESHEETS[attackElement] ?? null;
  const image = useImage(source);

  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  const frameWidth = (image?.width() ?? 1) / SPRITESHEET_COLUMNS;
  const imageHeight = image?.height() ?? frameWidth;
  // Assumes square frames (frameHeight ≈ frameWidth). If a spritesheet has
  // non-square frames, numRows will be incorrect.
  const numRows = Math.max(1, Math.round(imageHeight / frameWidth));
  const frameHeight = imageHeight / numRows;
  const totalFrames = Math.max(1, SPRITESHEET_COLUMNS * numRows);
  const scaleX = layout ? layout.width / frameWidth : 1;
  const scaleY = layout ? layout.height / frameHeight : 1;

  const translateX = useDerivedValue(() => {
    if (!layout || !image) return 0;
    const idx = Math.min(Math.floor(progress.value * totalFrames), totalFrames - 1);
    const col = idx % SPRITESHEET_COLUMNS;
    return -col * frameWidth * scaleX;
  });

  const translateY = useDerivedValue(() => {
    if (!layout || !image) return 0;
    const idx = Math.min(Math.floor(progress.value * totalFrames), totalFrames - 1);
    const row = Math.floor(idx / SPRITESHEET_COLUMNS);
    return -row * frameHeight * scaleY;
  });

  const clipRect = React.useMemo(
    () => Skia.XYWHRect(0, 0, layout?.width ?? 0, layout?.height ?? 0),
    [layout],
  );

  if (!layout || !image) {
    return <View style={styles.overlay} pointerEvents="none" onLayout={onLayout} />;
  }

  return (
    <View style={styles.overlay} pointerEvents="none" onLayout={onLayout}>
      <Canvas style={styles.canvas}>
        <Group clip={clipRect}>
          <Image
            image={image}
            x={translateX}
            y={translateY}
            width={image.width() * scaleX}
            height={image.height() * scaleY}
            fit="fill"
          />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
});
