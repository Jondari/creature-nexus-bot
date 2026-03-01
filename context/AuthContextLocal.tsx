/**
 * AuthContextLocal - Local authentication context for demo mode
 *
 * Provides the same interface as AuthContext but without Firebase.
 * All data is stored locally via AsyncStorage.
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  getDemoUser,
  initializeDemoUser,
  updateDemoUser,
  getDemoCoins,
  setDemoCoins,
  getDemoCards,
  addDemoCards,
  getDemoPacks,
  addDemoPack,
  removeDemoPack,
  getDemoLastFreePack,
  setDemoLastFreePack,
  clearAllDemoData,
  DemoUserProfile,
  InventoryPack,
} from '@/utils/localStorageUtils';
import { validatePseudo } from '@/utils/pseudoUtils';
import { Card } from '@/models/Card';
import { generatePackCards } from '@/utils/boosterUtils';
import { getPackById } from '@/data/boosterPacks';

// Fake User type compatible with Firebase User interface (minimal subset)
export interface DemoUser {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  displayName: string | null;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export interface AuthContextType {
  user: DemoUser | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  linkWithEmail: (email: string, password: string) => Promise<void>;
  linkWithGoogle: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccountWithEmail: (email: string, password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAnonymous: boolean;
  avatarCreature: string | null;
  updateAvatar: (creatureName: string | null) => Promise<void>;
  pseudo: string | null;
  pseudoChangeUsed: boolean;
  updatePseudo: (newPseudo: string) => Promise<void>;
  // Demo-specific: expose local data getters for components
  getCoins: () => Promise<number>;
  setCoins: (amount: number) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  getCards: () => Promise<Card[]>;
  addCards: (cards: Card[]) => Promise<Card[]>;
  getPacks: () => Promise<InventoryPack[]>;
  addPack: (pack: InventoryPack) => Promise<void>;
  removePack: (pack: InventoryPack) => Promise<void>;
  openPack: (packId: string) => Promise<Card[]>;
  getLastFreePack: () => Promise<number | null>;
  setLastFreePack: (timestamp: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInAnonymously: async () => {},
  signOut: async () => {},
  linkWithEmail: async () => {},
  linkWithGoogle: async () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  createAccountWithEmail: async () => {},
  deleteAccount: async () => {},
  isAnonymous: true,
  avatarCreature: null,
  updateAvatar: async () => {},
  pseudo: null,
  pseudoChangeUsed: false,
  updatePseudo: async () => {},
  getCoins: async () => 0,
  setCoins: async () => {},
  addCoins: async () => {},
  spendCoins: async () => false,
  getCards: async () => [],
  addCards: async () => [],
  getPacks: async () => [],
  addPack: async () => {},
  removePack: async () => {},
  openPack: async () => [],
  getLastFreePack: async () => null,
  setLastFreePack: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarCreature, setAvatarCreature] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [pseudoChangeUsed, setPseudoChangeUsed] = useState(false);

  // Initialize: check for existing demo user or auto sign-in
  useEffect(() => {
    const initialize = async () => {
      try {
        let profile = await getDemoUser();

        // Auto sign-in if user exists, otherwise create new
        if (!profile) {
          profile = await initializeDemoUser();
        }

        setUser({
          uid: profile.uid,
          isAnonymous: true,
          email: null,
          displayName: profile.pseudo,
          metadata: {
            creationTime: profile.createdAt,
            lastSignInTime: new Date().toISOString(),
          },
        });
        setPseudo(profile.pseudo);
        setPseudoChangeUsed(profile.pseudoChangeUsed);
        setAvatarCreature(profile.avatarCreature);
      } catch (error) {
        if (__DEV__) {
          console.error('Error initializing demo auth:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Sign in anonymously (in demo mode, this creates a new user if needed)
  const anonymousSignIn = async () => {
    try {
      setLoading(true);
      const profile = await initializeDemoUser();
      setUser({
        uid: profile.uid,
        isAnonymous: true,
        email: null,
        displayName: profile.pseudo,
        metadata: {
          creationTime: profile.createdAt,
          lastSignInTime: new Date().toISOString(),
        },
      });
      setPseudo(profile.pseudo);
      setPseudoChangeUsed(false);
      setAvatarCreature(null);
    } catch (error) {
      if (__DEV__) {
        console.error('Error signing in anonymously (demo):', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign out (clear demo data and reset)
  const handleSignOut = async () => {
    try {
      await clearAllDemoData();
      setUser(null);
      setPseudo(null);
      setPseudoChangeUsed(false);
      setAvatarCreature(null);
    } catch (error) {
      if (__DEV__) {
        console.error('Error signing out (demo):', error);
      }
    }
  };

  // Link with email - not supported in demo mode
  const linkWithEmail = async (_email: string, _password: string) => {
    throw new Error('Email linking is not available in demo mode');
  };

  // Link with Google - not supported in demo mode
  const linkWithGoogle = async () => {
    throw new Error('Google linking is not available in demo mode');
  };

  // Sign in with Google - not supported in demo mode
  const signInWithGoogle = async () => {
    throw new Error('Google sign-in is not available in demo mode');
  };

  // Sign in with email - not supported in demo mode
  const signInWithEmail = async (_email: string, _password: string) => {
    throw new Error('Email sign-in is not available in demo mode');
  };

  // Create account with email - not supported in demo mode
  const createAccountWithEmail = async (_email: string, _password: string) => {
    throw new Error('Account creation is not available in demo mode');
  };

  // Delete account - clears demo data
  const deleteAccount = async () => {
    await handleSignOut();
  };

  // Update avatar
  const updateAvatar = async (creatureName: string | null) => {
    await updateDemoUser({ avatarCreature: creatureName });
    setAvatarCreature(creatureName);
  };

  // Update pseudo
  const updatePseudo = async (newPseudo: string) => {
    if (pseudoChangeUsed) {
      throw new Error('Pseudo change already used');
    }

    if (!validatePseudo(newPseudo)) {
      throw new Error('Invalid pseudo format');
    }

    await updateDemoUser({ pseudo: newPseudo, pseudoChangeUsed: true });
    setPseudo(newPseudo);
    setPseudoChangeUsed(true);
  };

  // Add coins to balance
  const addCoins = async (amount: number): Promise<void> => {
    const current = await getDemoCoins();
    await setDemoCoins(current + amount);
  };

  // Spend coins (with validation)
  const spendCoins = async (amount: number): Promise<boolean> => {
    const current = await getDemoCoins();
    if (current < amount) return false;
    await setDemoCoins(current - amount);
    return true;
  };

  // Open a pack and add cards to collection
  const openPack = async (packId: string): Promise<Card[]> => {
    const pack = getPackById(packId);
    if (!pack) {
      throw new Error(`Pack ${packId} not found`);
    }

    const cards = generatePackCards(pack);
    await addDemoCards(cards);
    return cards;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInAnonymously: anonymousSignIn,
        signOut: handleSignOut,
        linkWithEmail,
        linkWithGoogle,
        signInWithGoogle,
        signInWithEmail,
        createAccountWithEmail,
        deleteAccount,
        isAnonymous: true,
        avatarCreature,
        updateAvatar,
        pseudo,
        pseudoChangeUsed,
        updatePseudo,
        // Demo-specific helpers
        getCoins: getDemoCoins,
        setCoins: setDemoCoins,
        addCoins,
        spendCoins,
        getCards: getDemoCards,
        addCards: addDemoCards,
        getPacks: getDemoPacks,
        addPack: addDemoPack,
        removePack: removeDemoPack,
        openPack,
        getLastFreePack: getDemoLastFreePack,
        setLastFreePack: setDemoLastFreePack,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
