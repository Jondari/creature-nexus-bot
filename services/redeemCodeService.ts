import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { addNexusCoins } from '@/utils/currencyUtils';
import { RedeemCode, RedeemResult, RedeemCodeRewards } from '@/types/redeem';

export class RedeemCodeService {
  private static activeCodes: RedeemCode[] = [];
  private static lastFetch: number = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async fetchActiveCodes(): Promise<RedeemCode[]> {
    const now = Date.now();
    
    // Return cached codes if still fresh
    if (this.activeCodes.length > 0 && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.activeCodes;
    }

    try {
      const codesRef = collection(db, 'redeemCodes');
      const q = query(
        codesRef,
        where('isActive', '==', true),
        where('expiryDate', '>', new Date())
      );
      
      const snapshot = await getDocs(q);
      this.activeCodes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          expiryDate: data.expiryDate.toDate(),
          createdAt: data.createdAt.toDate()
        } as RedeemCode;
      });
      
      this.lastFetch = now;
      return this.activeCodes;
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching redeem codes:', error);
      }
      return [];
    }
  }

  static async redeemCode(code: string, userId: string): Promise<RedeemResult> {
    try {
      // 1. Normalize code input
      const normalizedCode = code.trim().toUpperCase();
      
      // 2. Find code in active codes
      const activeCodes = await this.fetchActiveCodes();
      const validCode = activeCodes.find(c => c.code === normalizedCode);
      
      if (!validCode) {
        return { success: false, error: 'Invalid or expired code' };
      }

      // 3. Check usage limits for multi-use codes
      if (validCode.usageLimit && validCode.usedCount >= validCode.usageLimit) {
        return { success: false, error: 'Code usage limit reached' };
      }
      
      // 4. Check if user already redeemed this code
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (!validCode.isMultiUse && userData?.redeemedCodes?.includes(normalizedCode)) {
        return { success: false, error: 'Code already redeemed' };
      }
      
      // 5. Award rewards and get details for UI animations
      const details = await this.processRewards(validCode.rewards, userId);
      
      // 6. Mark code as used
      await this.markCodeAsUsed(normalizedCode, userId, validCode.id);
      
      // 7. Clear cache to reflect updated usage count
      this.clearCache();
      
      return {
        success: true,
        rewards: validCode.rewards,
        message: this.generateSuccessMessage(validCode.rewards),
        details
      };
      
    } catch (error) {
      if (__DEV__) {
        console.error('Error redeeming code:', error);
      }
      return { success: false, error: 'Failed to redeem code. Please try again.' };
    }
  }

  private static async processRewards(rewards: RedeemCodeRewards, userId: string): Promise<{ coins?: number; packs?: any[]; cards?: any[] }> {
    const promises: Promise<any>[] = [];
    const awarded = { coins: 0 as number | undefined, packs: [] as any[], cards: [] as any[] };
    
    // Award Nexus Coins
    if (rewards.nexusCoins && rewards.nexusCoins > 0) {
      awarded.coins = (awarded.coins || 0) + rewards.nexusCoins;
      promises.push(addNexusCoins(userId, rewards.nexusCoins));
    }
    
    // Award Packs - Integration with existing booster system
    if (rewards.packs && rewards.packs.length > 0) {
      try {
        // Try to import pack utilities if they exist
        const { addPackToInventory } = await import('@/utils/packInventory');
        const { getPackById } = await import('@/data/boosterPacks');
        
        for (const packId of rewards.packs) {
          const pack = getPackById(packId);
          if (pack) {
            awarded.packs.push(pack);
            promises.push(addPackToInventory(userId, pack, 'Redeem Code'));
          }
        }
      } catch (importError) {
        if (__DEV__) {
          console.log('Pack inventory system not yet implemented, skipping pack rewards');
        }
      }
    }
    
    // Award Individual Cards
    if (rewards.cards && rewards.cards.length > 0) {
      try {
        const { awardSpecificCard, awardRandomCard } = await import('@/utils/cardRewards');
        for (const cardIdentifier of rewards.cards) {
          if (cardIdentifier === 'random') {
            const card = await awardRandomCard(userId, 'Redeem Code');
            awarded.cards.push(card);
          } else if (cardIdentifier.startsWith('random_')) {
            const rarity = cardIdentifier.split('_')[1] as any;
            const card = await awardRandomCard(userId, 'Redeem Code', rarity);
            awarded.cards.push(card);
          } else {
            const card = await awardSpecificCard(userId, cardIdentifier, 'Redeem Code');
            awarded.cards.push(card);
          }
        }
      } catch (importError) {
        if (__DEV__) {
          console.error('Card rewards system not available:', importError);
        }
      }
    }
    
    await Promise.all(promises);
    return awarded;
  }

  private static async markCodeAsUsed(code: string, userId: string, codeId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const codeRef = doc(db, 'redeemCodes', codeId);
    
    // Update user document
    await updateDoc(userRef, {
      redeemedCodes: arrayUnion(code),
      lastCodeRedeemed: {
        code,
        redeemedAt: serverTimestamp(),
      }
    });

    // Update code usage count
    const codeDoc = await getDoc(codeRef);
    if (codeDoc.exists()) {
      const currentCount = codeDoc.data().usedCount || 0;
      await updateDoc(codeRef, {
        usedCount: currentCount + 1
      });
    }
  }

  private static generateSuccessMessage(rewards: RedeemCodeRewards): string {
    const messages: string[] = [];
    
    if (rewards.nexusCoins && rewards.nexusCoins > 0) {
      messages.push(`${rewards.nexusCoins} Nexus Coins`);
    }
    
    if (rewards.packs && rewards.packs.length > 0) {
      messages.push(`${rewards.packs.length} booster pack${rewards.packs.length > 1 ? 's' : ''}`);
    }
    
    if (rewards.cards && rewards.cards.length > 0) {
      messages.push(`${rewards.cards.length} special card${rewards.cards.length > 1 ? 's' : ''}`);
    }
    
    return `You received: ${messages.join(', ')}!`;
  }

  // Utility method to clear cache (useful for admin operations)
  static clearCache(): void {
    this.activeCodes = [];
    this.lastFetch = 0;
  }
}
