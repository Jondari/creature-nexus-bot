/**
 * Local/Demo Mode Configuration
 *
 * When EXPO_PUBLIC_DEMO_MODE is set to 'true', the app runs in offline mode
 * without Firebase dependencies. All data is stored locally via AsyncStorage.
 */

export const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

// Same value as DEFAULT_STARTING_COINS in currencyUtils.ts
// Duplicated here to avoid importing Firebase in demo mode
const DEFAULT_STARTING_COINS = 100;

export const DEMO_CONFIG = {
  // Starting resources for demo users
  startingCoins: DEFAULT_STARTING_COINS,

  // Number of starter packs for new demo users
  startingPacks: 2,

  // Demo user UID prefix
  demoUserUidPrefix: 'demo_user_',
};
