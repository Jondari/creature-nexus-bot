import { AvailableAvatar } from '@/types/avatar';

// List of 5 available avatars
export const AVAILABLE_AVATARS: AvailableAvatar[] = [
  { name: 'Flareen', element: 'fire' },
  { name: 'Cryil', element: 'water' },
  { name: 'Barkyn', element: 'earth' },
  { name: 'Lumen', element: 'earth' },
  { name: 'Ventun', element: 'air' },
];

// Get avatar image by creature name
export function getAvatarImage(creatureName: string | null) {
  if (!creatureName) {
    return require('@/assets/images/common/common_generic.png');
  }

  const avatarImages = {
    Flareen: require('@/assets/images/common/Flareen_avatar.png'),
    Cryil: require('@/assets/images/common/Cryil.png'),
    Barkyn: require('@/assets/images/common/Barkyn.png'),
    Lumen: require('@/assets/images/common/Lumen_avatar.png'),
    Ventun: require('@/assets/images/common/Ventun.png'),
  };

  return avatarImages[creatureName as keyof typeof avatarImages] || getDefaultAvatar();
}

// Get default avatar image
export function getDefaultAvatar() {
  return require('@/assets/images/common/common_generic.png');
}

// Get element color for border styling
export function getElementColor(element: string): string {
  const colors = {
    fire: '#FF6B6B',
    water: '#4ECDC4',
    earth: '#D4A574',
    air: '#95E1D3',
  };
  return colors[element as keyof typeof colors] || '#777777';
}
