export interface BattlefieldTheme {
  id: string;
  name: string;
  description: string;

  backgroundImage?: string;
  backgroundGradient?: {
    colors: string[];
    start: { x: number; y: number };
    end: { x: number; y: number };
  };

  fieldBackgroundColor?: string;
  fieldBorderColor?: string;
  fieldBorderWidth?: number;
  fieldBorderRadius?: number;

  cardSpacing?: number;
  cardElevation?: number;

  particleEffects?: {
    type: 'floating' | 'sparks' | 'smoke' | 'energy';
    density: number;
    color: string;
  }[];

  ambientSound?: string;
  actionSounds?: {
    cardPlay?: string;
    attack?: string;
    damage?: string;
  };
}

export interface PlayerFieldConfig {
  playerId: string;
  themeId: string;
  position: 'top' | 'bottom';
}

export interface BattlefieldConfig {
  playerFields: PlayerFieldConfig[];
  globalEffects?: {
    weather?: 'none' | 'rain' | 'storm' | 'fire' | 'ice';
    timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  };
}

export const BATTLEFIELD_THEMES: BattlefieldTheme[] = [
  {
    id: 'default',
    name: 'Classic Arena',
    description: 'Traditional battle arena with neutral colors',
    fieldBackgroundColor: 'rgba(0, 0, 0, 0.1)',
    fieldBorderColor: 'rgba(255, 255, 255, 0.2)',
    fieldBorderWidth: 1,
    fieldBorderRadius: 8,
  },
  {
    id: 'fire_temple',
    name: 'Fire Temple',
    description: 'Volcanic arena with lava flows and ember effects',
    backgroundGradient: {
      colors: ['#8B0000', '#FF4500', '#FF6347'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    fieldBackgroundColor: 'rgba(255, 69, 0, 0.2)',
    fieldBorderColor: '#FF4500',
    fieldBorderWidth: 2,
    fieldBorderRadius: 12,
    particleEffects: [
      {
        type: 'sparks',
        density: 15,
        color: '#FF6347',
      },
    ],
  },
  {
    id: 'water_shrine',
    name: 'Water Shrine',
    description: 'Serene aquatic environment with flowing water',
    backgroundGradient: {
      colors: ['#000080', '#4169E1', '#87CEEB'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    fieldBackgroundColor: 'rgba(65, 105, 225, 0.2)',
    fieldBorderColor: '#4169E1',
    fieldBorderWidth: 2,
    fieldBorderRadius: 12,
    particleEffects: [
      {
        type: 'floating',
        density: 10,
        color: '#87CEEB',
      },
    ],
  },
  {
    id: 'earth_cavern',
    name: 'Earth Cavern',
    description: 'Underground cave with crystals and rock formations',
    backgroundGradient: {
      colors: ['#2F4F4F', '#8FBC8F', '#228B22'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    fieldBackgroundColor: 'rgba(143, 188, 143, 0.2)',
    fieldBorderColor: '#8FBC8F',
    fieldBorderWidth: 2,
    fieldBorderRadius: 8,
  },
  {
    id: 'air_peaks',
    name: 'Sky Peaks',
    description: 'High altitude platform among the clouds',
    backgroundGradient: {
      colors: ['#87CEEB', '#B0E0E6', '#F0F8FF'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    fieldBackgroundColor: 'rgba(176, 224, 230, 0.2)',
    fieldBorderColor: '#87CEEB',
    fieldBorderWidth: 1,
    fieldBorderRadius: 16,
    particleEffects: [
      {
        type: 'floating',
        density: 8,
        color: '#F0F8FF',
      },
    ],
  },
];
