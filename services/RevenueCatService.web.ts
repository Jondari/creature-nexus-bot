// Web stub for RevenueCat - maintains same interface as native
// In-app purchases are not supported on web platform

export interface RCProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  packageType?: string;
}

// Stub product IDs for compatibility
export const PRODUCT_IDS = {
  STANDARD_PACK: 'standard_pack',
  ELEMENTAL_PACK: 'elemental_pack', 
  LEGENDARY_PACK: 'legendary_pack',
  MYTHIC_PACK: 'mythic_pack',
  NEXUS_COINS_100: 'nexus_coins_100',
  NEXUS_COINS_500: 'nexus_coins_500',
  NEXUS_COINS_1000: 'nexus_coins_1000',
} as const;

export class RevenueCatService {
  static readonly PRODUCT_IDS = PRODUCT_IDS;

  static async initialize(): Promise<void> {
    // Web stub - no initialization needed
    if (__DEV__) {
      console.log('RevenueCatService (web) initialized - purchases not available');
    }
  }

  static async getProducts(): Promise<RCProduct[]> {
    // Web stub - return empty array
    if (__DEV__) {
      console.warn('In-app purchases not available on web platform');
    }
    return [];
  }

  static async getProduct(productId: string): Promise<RCProduct | null> {
    // Web stub - return null
    return null;
  }

  static async purchaseProduct(productId: string): Promise<{
    success: boolean;
    error?: string;
    purchaseToken?: string;
    customerInfo?: any;
  }> {
    // Web stub - always return error
    return {
      success: false,
      error: 'In-app purchases are not available on web. Please use the mobile app to make purchases.'
    };
  }

  static async restorePurchases(): Promise<any> {
    // Web stub - return null
    if (__DEV__) {
      console.warn('Restore purchases not available on web');
    }
    return null;
  }

  static async getCustomerInfo(): Promise<any> {
    // Web stub - return null
    return null;
  }

  static async finishTransaction(purchaseToken?: string): Promise<void> {
    // Web stub - no-op
  }

  static async disconnect(): Promise<void> {
    // Web stub - no-op
  }
}

export default RevenueCatService;