import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { getAvatarImage, getElementColor, AVAILABLE_AVATARS } from '@/utils/avatarUtils';
import Colors from '@/constants/Colors';

interface PlayerAvatarProps {
  creatureName: string | null;
  size?: 'small' | 'medium' | 'large';
  showBorder?: boolean;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  creatureName,
  size = 'medium',
  showBorder = true
}) => {
  const avatarImage = getAvatarImage(creatureName);

  // Find creature's element for border color
  const creature = AVAILABLE_AVATARS.find(a => a.name === creatureName);
  const borderColor = creature
    ? getElementColor(creature.element)
    : Colors.neutral[400];

  // Size dimensions in pixels
  const dimensions = {
    small: 60,
    medium: 100,
    large: 140
  };

  const avatarSize = dimensions[size];
  const borderWidth = size === 'small' ? 2 : 3;

  return (
    <View style={[
      styles.container,
      {
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        borderWidth: showBorder ? borderWidth : 0,
        borderColor: showBorder ? borderColor : 'transparent'
      }
    ]}>
      <Image
        source={avatarImage}
        style={[
          styles.image,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2
          }
        ]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    backgroundColor: Colors.background.secondary,
  }
});
