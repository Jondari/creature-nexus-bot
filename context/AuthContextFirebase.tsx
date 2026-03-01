import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User, 
  signOut, 
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, deleteDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { DEFAULT_STARTING_COINS, getUserCurrency, addNexusCoins, spendNexusCoins } from '@/utils/currencyUtils';
import { getInventoryPacks, removePackFromInventory } from '@/utils/packInventory';
import { Card } from '@/models/Card';
import { generatePackCards } from '@/utils/boosterUtils';
import { getPackById } from '@/data/boosterPacks';
import type { InventoryPack } from '@/utils/localStorageUtils';
import { generateDefaultPseudo } from '@/utils/pseudoUtils';
import { auth, db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Google } from 'expo-auth-session/providers/google';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
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
  // Data access methods (shared interface with AuthContextLocal)
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
  isAnonymous: false,
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

// Configure WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

// Configure Google Sign-In for Android
if (Platform.OS === 'android') {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
  });
}

export const useAuth = () => useContext(AuthContext);

const ANONYMOUS_USER_KEY = 'anonymousUserId';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [avatarCreature, setAvatarCreature] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [pseudoChangeUsed, setPseudoChangeUsed] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a stored anonymous user ID
        const storedUserId = await AsyncStorage.getItem(ANONYMOUS_USER_KEY);
        
        // If we have a stored ID but no current user, auto sign in
        if (storedUserId && !auth.currentUser) {
          if (__DEV__) {
            console.log('Restoring anonymous session...');
          }
          await signInAnonymously(auth);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error initializing auth:', error);
        }
      }
    };

    initializeAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsAnonymous(user.isAnonymous);
        
        // Store the anonymous user ID for future sessions
        if (user.isAnonymous) {
          await AsyncStorage.setItem(ANONYMOUS_USER_KEY, user.uid);
        }
        
        // Check if user document exists
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        // If not, create it
        if (!userDoc.exists()) {
          const defaultPseudo = generateDefaultPseudo();
          await setDoc(userDocRef, {
            uid: user.uid,
            createdAt: serverTimestamp(),
            lastPackOpened: null,
            cards: [],
            nexusCoins: DEFAULT_STARTING_COINS,
            avatarCreature: null,
            pseudo: defaultPseudo,
            pseudoChangeUsed: false
          });
          setPseudo(defaultPseudo);
          setPseudoChangeUsed(false);
        } else {
          // Load data from Firestore
          const userData = userDoc.data();
          setAvatarCreature(userData?.avatarCreature || null);

          // Migration for existing accounts without pseudo
          if (userData?.pseudo === undefined) {
            const defaultPseudo = generateDefaultPseudo();
            await updateDoc(userDocRef, {
              pseudo: defaultPseudo,
              pseudoChangeUsed: false
            });
            setPseudo(defaultPseudo);
            setPseudoChangeUsed(false);
          } else {
            setPseudo(userData.pseudo);
            setPseudoChangeUsed(userData.pseudoChangeUsed || false);
          }
        }
      } else {
        setUser(null);
        setIsAnonymous(false);
        setAvatarCreature(null);
        setPseudo(null);
        setPseudoChangeUsed(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const anonymousSignIn = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (error) {
      if (__DEV__) {
        console.error('Error signing in anonymously:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear stored anonymous user ID
      await AsyncStorage.removeItem(ANONYMOUS_USER_KEY);
      
      // Sign out from native Google Sign-In on Android
      if (Platform.OS === 'android') {
        try {
          await GoogleSignin.signOut();
        } catch (error) {
          // Ignore if user wasn't signed in with Google Sign-In
          if (__DEV__) {
            console.log('No Google Sign-In session to clear');
          }
        }
      }
      
      // Sign out from Firebase (works for all auth methods)
      await signOut(auth);
    } catch (error) {
      if (__DEV__) {
        console.error('Error signing out:', error);
      }
    }
  };

  const linkWithEmail = async (email: string, password: string) => {
    if (!user || !user.isAnonymous) {
      throw new Error('No anonymous user to link');
    }

    try {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(user, credential);
      
      // Update user document to mark as non-anonymous
      const userDocRef = doc(db, 'users', result.user.uid);
      await updateDoc(userDocRef, {
        email: email,
        isAnonymous: false,
        linkedAt: serverTimestamp()
      });

      // Clear anonymous flag from storage since user is now permanent
      await AsyncStorage.removeItem(ANONYMOUS_USER_KEY);
      
      // Force update the user state and anonymous flag to trigger re-render
      setUser(result.user);
      setIsAnonymous(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Error linking with email:', error);
      }
      throw error;
    }
  };

  const performWebGoogleAuth = async () => {
    try {
      // Web-based Google OAuth using expo-auth-session
      const request = new AuthSession.AuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken,
        redirectUri: AuthSession.makeRedirectUri({}),
        usePKCE: false, // Explicitly disable PKCE for Google OAuth
        extraParams: {
          nonce: 'nonce' // Add nonce for security
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        useProxy: true,
        showInRecents: true,
      });

      if (result.type === 'success' && result.params.id_token) {
        const credential = GoogleAuthProvider.credential(result.params.id_token);
        return credential;
      } else {
        throw new Error('Google sign-in was cancelled or failed');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error with web Google auth:', error);
      }
      throw error;
    }
  };

  const performNativeGoogleAuth = async () => {
    try {
      // Native Android Google Sign-In
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        const credential = GoogleAuthProvider.credential(userInfo.data.idToken);
        return credential;
      } else {
        throw new Error('No ID token received from Google Sign-In');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error with native Google auth:', error);
      }
      throw error;
    }
  };

  const performGoogleAuth = async () => {
    // Use platform-specific authentication
    if (Platform.OS === 'web') {
      return await performWebGoogleAuth();
    } else if (Platform.OS === 'android') {
      return await performNativeGoogleAuth();
    } else {
      throw new Error('Google authentication not supported on this platform');
    }
  };

  const linkWithGoogle = async () => {
    if (!user || !user.isAnonymous) {
      throw new Error('No anonymous user to link');
    }

    try {
      const credential = await performGoogleAuth();
      const result = await linkWithCredential(user, credential);
      
      // Update user document to mark as non-anonymous
      const userDocRef = doc(db, 'users', result.user.uid);
      await updateDoc(userDocRef, {
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        isAnonymous: false,
        linkedAt: serverTimestamp()
      });

      // Clear anonymous flag from storage since user is now permanent
      await AsyncStorage.removeItem(ANONYMOUS_USER_KEY);
      
      // Force update the user state and anonymous flag to trigger re-render
      setUser(result.user);
      setIsAnonymous(false);
    } catch (error) {
      if (__DEV__) {
        console.error('Error linking with Google:', error);
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const credential = await performGoogleAuth();
      const result = await signInWithCredential(auth, credential);
      
      // Check if user document exists, create if not
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const defaultPseudo = generateDefaultPseudo();
        await setDoc(userDocRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: serverTimestamp(),
          lastPackOpened: null,
          cards: [],
          nexusCoins: DEFAULT_STARTING_COINS,
          isAnonymous: false,
          avatarCreature: null,
          pseudo: defaultPseudo,
          pseudoChangeUsed: false
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error signing in with Google:', error);
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (__DEV__) {
        console.error('Error signing in with email:', error);
      }
      throw error;
    }
  };

  const createAccountWithEmail = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Create user document
      const defaultPseudo = generateDefaultPseudo();
      const userDocRef = doc(db, 'users', result.user.uid);
      await setDoc(userDocRef, {
        uid: result.user.uid,
        email: email,
        createdAt: serverTimestamp(),
        lastPackOpened: null,
        cards: [],
        nexusCoins: DEFAULT_STARTING_COINS,
        isAnonymous: false,
        avatarCreature: null,
        pseudo: defaultPseudo,
        pseudoChangeUsed: false
      });
    } catch (error) {
      if (__DEV__) {
        console.error('Error creating account with email:', error);
      }
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!user) {
      throw new Error('No user to delete');
    }

    if (user.isAnonymous) {
      throw new Error('Cannot delete anonymous accounts');
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);

      // Delete user document from Firestore
      await deleteDoc(userDocRef);

      // Delete user from Firebase Auth
      await deleteUser(user);

      // Clear any stored data
      await AsyncStorage.removeItem(ANONYMOUS_USER_KEY);
      await AsyncStorage.removeItem(`avatar_${user.uid}`);
    } catch (error) {
      if (__DEV__) {
        console.error('Error deleting account:', error);
      }
      throw error;
    }
  };

  const updateAvatar = async (creatureName: string | null) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        avatarCreature: creatureName
      });

      // Update local state
      setAvatarCreature(creatureName);

      // Persist to AsyncStorage for offline
      await AsyncStorage.setItem(
        `avatar_${user.uid}`,
        creatureName || 'default'
      );
    } catch (error) {
      if (__DEV__) {
        console.error('Error updating avatar:', error);
      }
      throw error;
    }
  };

  const updatePseudo = async (newPseudo: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    if (pseudoChangeUsed) {
      throw new Error('Pseudo change already used');
    }

    try {
      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        pseudo: newPseudo,
        pseudoChangeUsed: true
      });

      // Update local state
      setPseudo(newPseudo);
      setPseudoChangeUsed(true);

      // Persist to AsyncStorage for offline
      await AsyncStorage.setItem(`pseudo_${user.uid}`, newPseudo);
    } catch (error) {
      if (__DEV__) {
        console.error('Error updating pseudo:', error);
      }
      throw error;
    }
  };

  // --- Data access methods (wrapping Firebase utilities) ---

  const getCoins = async (): Promise<number> => {
    if (!user) return 0;
    const currency = await getUserCurrency(user.uid);
    return currency.nexusCoins;
  };

  const setCoinsValue = async (amount: number): Promise<void> => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { nexusCoins: amount });
  };

  const addCoins = async (amount: number): Promise<void> => {
    if (!user) return;
    await addNexusCoins(user.uid, amount);
  };

  const spendCoins = async (amount: number): Promise<boolean> => {
    if (!user) return false;
    return await spendNexusCoins(user.uid, amount);
  };

  const getCards = async (): Promise<Card[]> => {
    if (!user) return [];
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().cards || [];
    }
    return [];
  };

  const addCardsToCollection = async (cards: Card[]): Promise<Card[]> => {
    if (!user) return cards;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { cards: arrayUnion(...cards) });
    return cards;
  };

  const getPacksFromInventory = async (): Promise<InventoryPack[]> => {
    if (!user) return [];
    return await getInventoryPacks(user.uid);
  };

  const addPackToInv = async (pack: InventoryPack): Promise<void> => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { unopenedPacks: arrayUnion(pack) });
  };

  const removePackFromInv = async (pack: InventoryPack): Promise<void> => {
    if (!user) return;
    await removePackFromInventory(user.uid, pack);
  };

  const openPack = async (packId: string): Promise<Card[]> => {
    const pack = getPackById(packId);
    if (!pack) throw new Error(`Pack ${packId} not found`);
    const cards = generatePackCards(pack);
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { cards: arrayUnion(...cards) });
    }
    return cards;
  };

  const getLastFreePackTimestamp = async (): Promise<number | null> => {
    if (!user) return null;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.lastPackOpened?.toMillis() || null;
    }
    return null;
  };

  const setLastFreePackTimestamp = async (timestamp: number): Promise<void> => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { lastPackOpened: Timestamp.fromMillis(timestamp) });
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
        isAnonymous,
        avatarCreature,
        updateAvatar,
        pseudo,
        pseudoChangeUsed,
        updatePseudo,
        // Data access methods
        getCoins,
        setCoins: setCoinsValue,
        addCoins,
        spendCoins,
        getCards,
        addCards: addCardsToCollection,
        getPacks: getPacksFromInventory,
        addPack: addPackToInv,
        removePack: removePackFromInv,
        openPack,
        getLastFreePack: getLastFreePackTimestamp,
        setLastFreePack: setLastFreePackTimestamp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};