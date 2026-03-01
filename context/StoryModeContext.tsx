/**
 * StoryModeContext - Facade that re-exports from Providers
 *
 * This file re-exports StoryModeProvider, useStoryMode, and getAIDeckForBattle
 * from Providers.tsx, which conditionally loads either Firebase or Local
 * implementation based on EXPO_PUBLIC_DEMO_MODE.
 */

export { StoryModeProvider, useStoryMode, getAIDeckForBattle } from './Providers';
export type { StoryModeContextType } from '@/context/StoryModeContextLocal';
