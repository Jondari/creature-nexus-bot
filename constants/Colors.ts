const primaryColors = {
  50: '#e6e8f5',
  100: '#c2c7e6',
  200: '#9aa2d6',
  300: '#717dc5',
  400: '#5461b8',
  500: '#3647ac',
  600: '#2c3a9f',
  700: '#202d8f',
  800: '#16217f',
  900: '#0b1560',
};

const accentColors = {
  50: '#fce9ff',
  100: '#f3c2ff',
  200: '#e99aff',
  300: '#e072ff',
  400: '#d94aff',
  500: '#d323ff',
  600: '#c800ff',
  700: '#b100e3',
  800: '#9900c7',
  900: '#7c00ab',
};

const neutralColors = {
  50: '#f7f7f8',
  100: '#eeeef1',
  200: '#d8d9e0',
  300: '#b6b8c2',
  400: '#8e919f',
  500: '#6b6e7c',
  600: '#555763',
  700: '#434551',
  800: '#2e303a',
  900: '#121626',
};

export default {
  primary: primaryColors,
  accent: accentColors,
  neutral: neutralColors,
  common: '#8e919f', // Grey for common cards
  rare: '#3e7cc9', // Blue for rare cards
  epic: '#9855d4', // Purple for epic cards
  legendary: '#df8c2b', // Orange for legendary cards
  mythic: '#e84b55', // Red for mythic cards
  error: '#e84b55', // Red for error states
  text: {
    primary: '#FFFFFF',
    secondary: '#B6B8C2',
    dark: '#121626',
  },
  background: {
    primary: '#121626',
    secondary: '#1E2035',
    card: '#2E303A',
  },
};