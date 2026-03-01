import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Asset } from 'expo-asset';
import type { SharedValue } from 'react-native-reanimated';
import type { Element } from '../../types/game';
import { ATTACK_SPRITESHEETS, SPRITESHEET_COLUMNS } from './attackSprites';

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
  progress: SharedValue<number>;
  attackElement: Exclude<Element, 'all'>;
}

export default function WebSpritesheetAttack({ progress, attackElement }: Props) {
  const source = ATTACK_SPRITESHEETS[attackElement];
  const [layout, setLayout] = React.useState<{ width: number; height: number } | null>(null);
  const asset = React.useMemo(() => {
    if (!source) return null;
    return Asset.fromModule(source as number);
  }, [source]);

  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  const frameWidth = asset ? asset.width / SPRITESHEET_COLUMNS : 1;
  const numRows = asset ? Math.max(1, Math.round(asset.height / frameWidth)) : 1;
  const frameHeight = asset ? asset.height / numRows : 1;
  const totalFrames = SPRITESHEET_COLUMNS * numRows;

  const animatedStyle = useAnimatedStyle(() => {
    if (!asset || !layout) {
      return { transform: [{ translateX: 0 }, { translateY: 0 }] };
    }
    const idx = Math.min(Math.floor(progress.value * totalFrames), totalFrames - 1);
    const col = idx % SPRITESHEET_COLUMNS;
    const row = Math.floor(idx / SPRITESHEET_COLUMNS);
    return {
      transform: [
        { translateX: -col * layout.width },
        { translateY: -row * layout.height },
      ],
    };
  });

  if (!asset) return null;
  if (!layout) return <View style={styles.overlay} pointerEvents="none" onLayout={onLayout} />;

  const scaleX = layout.width / frameWidth;
  const scaleY = layout.height / frameHeight;

  return (
    <View style={styles.overlay} pointerEvents="none" onLayout={onLayout}>
      <AnimatedImage
        source={source}
        resizeMode="stretch"
        style={[
          styles.image,
          {
            width: asset.width * scaleX,
            height: asset.height * scaleY,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 8,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
