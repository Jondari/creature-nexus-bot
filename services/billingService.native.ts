// BillingService - RevenueCat wrapper maintaining original interface
// This service delegates to RevenueCat while keeping the same API your store expects

import RevenueCatService, { RCProduct } from './RevenueCatService';
import { Platform } from 'react-native';

export interface BillingProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

export class BillingService {
  private static isInitialized = false;
  private static products: BillingProduct[] = [];

  // Keep original product IDs for mapping/compatibility
  static readonly PRODUCT_IDS = {
    STANDARD_PACK: 'standard_pack',
    ELEMENTAL_PACK: 'elemental_pack', 
    LEGENDARY_PACK: 'legendary_pack',
    MYTHIC_PACK: 'mythic_pack',
    NEXUS_COINS_100: 'nexus_coins_100',
    NEXUS_COINS_500: 'nexus_coins_500',
    NEXUS_COINS_1000: 'nexus_coins_1000',
  } as const;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await RevenueCatService.initialize();
      this.isInitialized = true;
      
      if (__DEV__) {
        console.log('BillingService (RevenueCat) initialized successfully');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to initialize BillingService (RevenueCat):', error);
      }
      throw error;
    }
  }

  static async getProducts(): Promise<BillingProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.products.length > 0) {
      return this.products;
    }

    try {
      const rcProducts = await RevenueCatService.getProducts();
      
      // Map RevenueCat products to BillingProduct interface
      this.products = rcProducts.map((p: RCProduct) => ({
        id: p.id,
        title: p.title,
        description: p.description || '',
        price: p.price,           // Already localized string from RevenueCat
        priceAmount: p.priceAmount,
        currency: p.currency,
      }));

      if (__DEV__) {
        console.log('BillingService products:', this.products.map(p => ({ 
          id: p.id, 
          title: p.title, 
          price: p.price 
        })));
      }

      return this.products;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to get products via RevenueCat:', error);
      }
      return [];
    }
  }

  static async getProduct(productId: string): Promise<BillingProduct | null> {
    const products = await this.getProducts();
    return products.find(product => product.id === productId) || null;
  }

  static async purchaseProduct(productId: string): Promise<{
    success: boolean;
    error?: string;
    purchaseToken?: string;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await RevenueCatService.purchaseProduct(productId);
      
      if (result.success) {
        if (__DEV__) {
          console.log('BillingService purchase successful:', {
            productId,
            success: true,
            purchaseToken: result.purchaseToken
          });
        }
        
        return {
          success: true,
          purchaseToken: result.purchaseToken
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('BillingService purchase failed:', error);
      }
      
      return {
        success: false,
        error: error?.message || 'Purchase failed. Please try again.'
      };
    }
  }

  static async finishTransaction(purchaseToken?: string): Promise<void> {
    // RevenueCat handles transaction finishing automatically
    await RevenueCatService.finishTransaction(purchaseToken);
    
    if (__DEV__) {
      console.log('Transaction finished (handled by RevenueCat)');
    }
  }

  static async disconnect(): Promise<void> {
    try {
      await RevenueCatService.disconnect();
      this.isInitialized = false;
      this.products = [];
      
      if (__DEV__) {
        console.log('BillingService (RevenueCat) disconnected');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to disconnect BillingService:', error);
      }
    }
  }

  // Additional RevenueCat-specific methods (bonus functionality)
  static async restorePurchases() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await RevenueCatService.restorePurchases();
  }

  static async getCustomerInfo() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return await RevenueCatService.getCustomerInfo();
  }
}

export default BillingService;