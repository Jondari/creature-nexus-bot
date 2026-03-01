import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UserCurrency } from '@/models/BoosterPack';

// Default starting currency for new users
export const DEFAULT_STARTING_COINS = 100;

// Get user's currency from Firebase (uses existing lastPackOpened field)
export const getUserCurrency = async (userId: string): Promise<UserCurrency> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      let nexusCoins = userData.nexusCoins;
      
      // Initialize nexusCoins if it doesn't exist
      if (nexusCoins === undefined) {
        nexusCoins = DEFAULT_STARTING_COINS;
        await updateDoc(userDocRef, {
          nexusCoins: DEFAULT_STARTING_COINS
        });
      }
      
      return {
        nexusCoins: nexusCoins,
        lastFreePackOpened: userData.lastPackOpened?.toDate() // Reuse existing field
      };
    }
    
    // New user, initialize with default currency
    await updateDoc(userDocRef, {
      nexusCoins: DEFAULT_STARTING_COINS
    });
    
    return {
      nexusCoins: DEFAULT_STARTING_COINS
    };
  } catch (error) {
    if (__DEV__) {
      console.error('Error fetching user currency:', error);
    }
    throw error;
  }
};

// Add Nexus Coins to user account
export const addNexusCoins = async (userId: string, amount: number): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      nexusCoins: increment(amount)
    });
  } catch (error) {
    if (__DEV__) {
      console.error('Error adding nexus coins:', error);
    }
    throw error;
  }
};

// Spend Nexus Coins (with validation)
export const spendNexusCoins = async (userId: string, amount: number): Promise<boolean> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      if (__DEV__) {
        console.error('User document does not exist:', userId);
      }
      return false;
    }
    
    const userData = userDoc.data();
    const currentCoins = userData.nexusCoins || 0;
    
    if (currentCoins < amount) {
      return false; // Insufficient funds
    }
    
    // Initialize nexusCoins field if it doesn't exist
    if (userData.nexusCoins === undefined) {
      await updateDoc(userDocRef, {
        nexusCoins: DEFAULT_STARTING_COINS - amount
      });
    } else {
      await updateDoc(userDocRef, {
        nexusCoins: increment(-amount)
      });
    }

    if (__DEV__) {
      console.log('Transaction successful');
    }
    return true; // Success
  } catch (error) {
    if (__DEV__) {
      console.error('Error spending nexus coins:', error);
    }
    return false; // Return false instead of throwing
  }
};

// Get current coin balance (quick check)
export const getCoinBalance = async (userId: string): Promise<number> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data().nexusCoins || 0;
    }
    
    return 0;
  } catch (error) {
    if (__DEV__) {
      console.error('Error getting coin balance:', error);
    }
    return 0;
  }
};

// Format coin amount for display
export const formatCoinAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
};

// Nexus Coin earning methods
export const COIN_REWARDS = {
  DAILY_LOGIN: 50,
  FIRST_WIN_DAILY: 25,
  WEEKLY_CHALLENGE: 100,
  TOURNAMENT_WIN: 200,
  ACHIEVEMENT_UNLOCK: 75,
  LEVEL_UP: 30
} as const;

// Award coins for achievements/rewards
export const awardCoins = async (
  userId: string, 
  rewardType: keyof typeof COIN_REWARDS,
  customAmount?: number
): Promise<void> => {
  try {
    const amount = customAmount || COIN_REWARDS[rewardType];
    await addNexusCoins(userId, amount);
    
    // TODO: Log the reward transaction for analytics
    if (__DEV__) {
      console.log(`Awarded ${amount} Nexus Coins to user ${userId} for ${rewardType}`);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error awarding coins:', error);
    }
    throw error;
  }
};

// Check if user can afford a purchase
export const canAfford = async (userId: string, cost: number): Promise<boolean> => {
  try {
    const balance = await getCoinBalance(userId);
    return balance >= cost;
  } catch (error) {
    if (__DEV__) {
      console.error('Error checking affordability:', error);
    }
    return false;
  }
};

// Initialize new user with starting currency (call this when creating new user)
export const initializeUserCurrency = async (userId: string): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      nexusCoins: DEFAULT_STARTING_COINS
    });
  } catch (error) {
    if (__DEV__) {
      console.error('Error initializing user currency:', error);
    }
    throw error;
  }
};