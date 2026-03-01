export interface BillingProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

export const PRODUCT_IDS = {
  STANDARD_PACK: 'standard_pack',
  ELEMENTAL_PACK: 'elemental_pack', 
  LEGENDARY_PACK: 'legendary_pack',
  MYTHIC_PACK: 'mythic_pack',
  NEXUS_COINS_100: 'nexus_coins_100',
  NEXUS_COINS_500: 'nexus_coins_500',
  NEXUS_COINS_1000: 'nexus_coins_1000',
} as const;

export class BillingService {
  static readonly PRODUCT_IDS = PRODUCT_IDS;

  static async initialize(): Promise<void> {
    // Web stub - no initialization needed
    return;
  }

  static async getProducts(): Promise<BillingProduct[]> {
    // Web stub - return empty array
    return [];
  }

  static async getProduct(productId: string): Promise<BillingProduct | null> {
    // Web stub - return null
    return null;
  }

  static async purchaseProduct(productId: string): Promise<{
    success: boolean;
    error?: string;
    purchaseToken?: string;
  }> {
    // Web stub - always return error
    return {
      success: false,
      error: 'In-app purchases are not available on web.'
    };
  }

  static async finishTransaction(purchaseToken: string): Promise<void> {
    // Web stub - no-op
    return;
  }

  static async disconnect(): Promise<void> {
    // Web stub - no-op
    return;
  }
}

export default BillingService;