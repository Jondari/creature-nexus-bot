import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { BoosterPack } from '@/models/BoosterPack';

// Simple pack inventory item
export interface InventoryPack {
  packId: string;
  packName: string;
  packType: string;
  earnedAt: string; // ISO date string
  reason: string; // "Daily Login", "Achievement", "Event Reward", etc.
}

// Add a bonus/earned pack to user's inventory (to be opened later)
export const addPackToInventory = async (
  userId: string,
  pack: BoosterPack,
  reason: string = 'Bonus Pack'
): Promise<void> => {
  try {
    const inventoryPack: InventoryPack = {
      packId: pack.id,
      packName: pack.name,
      packType: pack.type,
      earnedAt: new Date().toISOString(),
      reason
    };
    
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      unopenedPacks: arrayUnion(inventoryPack)
    });
  } catch (error) {
    if (__DEV__) {
      console.error('Error adding pack to inventory:', error);
    }
    throw error;
  }
};

// Get user's unopened inventory packs
export const getInventoryPacks = async (userId: string): Promise<InventoryPack[]> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data().unopenedPacks || [];
    }
    
    return [];
  } catch (error) {
    if (__DEV__) {
      console.error('Error getting inventory packs:', error);
    }
    return [];
  }
};

// Remove a pack from inventory (after opening)
export const removePackFromInventory = async (
  userId: string,
  packToRemove: InventoryPack
): Promise<void> => {
  try {
    // Get current packs and remove only the first match
    const currentPacks = await getInventoryPacks(userId);
    const index = currentPacks.findIndex(
      pack => pack.earnedAt === packToRemove.earnedAt && pack.packId === packToRemove.packId
    );
    const updatedPacks = [...currentPacks];
    if (index !== -1) {
      updatedPacks.splice(index, 1);
    }
    
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      unopenedPacks: updatedPacks
    });
  } catch (error) {
    if (__DEV__) {
      console.error('Error removing pack from inventory:', error);
    }
    throw error;
  }
};

// Award common bonus packs (for easy integration)
export const awardBonusPack = async (
  userId: string, 
  reason: string,
  packId: string = 'standard_pack'
): Promise<void> => {
  try {
    // Import pack data
    const { getPackById } = await import('@/data/boosterPacks');
    const pack = getPackById(packId);
    
    if (!pack) {
      if (__DEV__) {
        console.error(`Pack ${packId} not found`);
      }
      return;
    }
    
    await addPackToInventory(userId, pack, reason);
  } catch (error) {
    if (__DEV__) {
      console.error('Error awarding bonus pack:', error);
    }
    throw error;
  }
};