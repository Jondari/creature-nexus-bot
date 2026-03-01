/**
 * AuthContext - Facade that re-exports from Providers
 *
 * This file re-exports AuthProvider and useAuth from Providers.tsx,
 * which conditionally loads either Firebase or Local implementation
 * based on EXPO_PUBLIC_DEMO_MODE.
 */

export { AuthProvider, useAuth } from './Providers';
export type { InventoryPack } from './Providers';
export type { AuthContextType } from '@/context/AuthContextLocal';
