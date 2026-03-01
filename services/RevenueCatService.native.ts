import Purchases, { 
  CustomerInfo,
  LOG_LEVEL 
} from 'react-native-purchases';

export interface RCProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  packageType?: string;
}

// Product IDs (SKUs) for Google Play managed products
export const PRODUCT_IDS = {
  STANDARD_PACK: 'standard_pack',
  ELEMENTAL_PACK: 'elemental_pack',
  LEGENDARY_PACK: 'legendary_pack',
  MYTHIC_PACK: 'mythic_pack',
  NEXUS_COINS_100: 'nexus_coins_100',
  NEXUS_COINS_500: 'nexus_coins_500',
  NEXUS_COINS_1000: 'nexus_coins_1000',
} as const;

/** Resolve the correct "non-subscription" constant across SDK versions */
const INAPP_OR_NON_SUBS: any =
  (Purchases as any).PURCHASE_TYPE?.INAPP ??
  (Purchases as any).PRODUCT_CATEGORY?.NON_SUBSCRIPTION ??
  (Purchases as any).PRODUCT_TYPE?.NON_SUBSCRIPTION;

export class RevenueCatService {
  private static isInitialized = false;
  private static mockMode = false; // TEMP: Set to true for mock testing
  static readonly PRODUCT_IDS = PRODUCT_IDS;

  static async initialize(): Promise<void> {
    // RevenueCat is already configured in app startup
    // Just mark as initialized
    this.isInitialized = true;
    
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      console.log('RevenueCatService initialized');
    } else {
      Purchases.setLogLevel(LOG_LEVEL.WARN);
    }
  }

  static async getProducts(): Promise<RCProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Fetch products directly by identifiers (no Offerings)
      const skus = [
        PRODUCT_IDS.STANDARD_PACK,
        PRODUCT_IDS.ELEMENTAL_PACK,
        PRODUCT_IDS.LEGENDARY_PACK,
        PRODUCT_IDS.MYTHIC_PACK,
        PRODUCT_IDS.NEXUS_COINS_100,
        PRODUCT_IDS.NEXUS_COINS_500,
        PRODUCT_IDS.NEXUS_COINS_1000,
      ];

      // Force non-subscription type for Android compatibility across SDK versions
      const storeProducts = await Purchases.getProducts(skus as string[], INAPP_OR_NON_SUBS);

      const products: RCProduct[] = storeProducts.map((p: any) => ({
        id: p.identifier,
        title: p.title,
        description: p.description || '',
        price: p.priceString,
        priceAmount: p.price,
        currency: p.currencyCode,
      }));

      if (__DEV__) {
        console.log(
          'RevenueCat products (no offerings):',
          products.map(p => ({ id: p.id, price: p.price }))
        );
      }

      return products;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to get RevenueCat products (no offerings):', error);
      }
      return [];
    }
  }

  static async getProduct(productId: string): Promise<RCProduct | null> {
    const products = await this.getProducts();
    return products.find(product => product.id === productId) || null;
  }

  static async purchaseProduct(productId: string): Promise<{
    success: boolean;
    error?: string;
    purchaseToken?: string;
    cancelled?: boolean;
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get the StoreProduct with correct type (force INAPP)
      const storeProducts = await Purchases.getProducts([productId], INAPP_OR_NON_SUBS);
      const storeProduct = storeProducts.find(p => p.identifier === productId);
      
      if (!storeProduct) {
        throw new Error('Product not found in available products');
      }

      // Use purchaseStoreProduct to avoid type confusion
      const { customerInfo, productIdentifier } = await Purchases.purchaseStoreProduct(storeProduct);

      if (__DEV__) {
        console.log('Purchase successful:', { productIdentifier });
      }

      return { success: true, purchaseToken: productIdentifier };
    } catch (error: any) {
      const code = error?.code ?? error?.errorCode;
      const cancelled = !!error?.userCancelled;
      let errorMessage = typeof error?.message === 'string' ? error.message : 'Purchase failed';

      if (cancelled) {
        errorMessage = 'User cancelled';
      } else if (typeof code === 'string') {
        switch (code) {
          case 'PRODUCT_ALREADY_PURCHASED':
            errorMessage = 'Product already purchased';
            break;
          case 'PURCHASE_INVALID_ERROR':
            errorMessage = 'Purchase invalid';
            break;
          case 'PRODUCT_NOT_AVAILABLE':
            errorMessage = 'Product not available';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }

      if (__DEV__) {
        console.error('Purchase failed:', { code, cancelled, error });
      }

      return { success: false, error: errorMessage, cancelled };
    }
  }

  static async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const customerInfo = await Purchases.restorePurchases();
      
      if (__DEV__) {
        console.log('Purchases restored:', {
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers
        });
      }

      return customerInfo;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to restore purchases:', error);
      }
      return null;
    }
  }

  static async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return await Purchases.getCustomerInfo();
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to get customer info:', error);
      }
      return null;
    }
  }

  static async finishTransaction(purchaseToken?: string): Promise<void> {
    // RevenueCat handles transaction finishing automatically
    // No need to manually finish transactions
    if (__DEV__) {
      console.log('Transaction finished automatically by RevenueCat');
    }
  }

  static async disconnect(): Promise<void> {
    try {
      await Purchases.logOut();
    } catch (error) {
      if (__DEV__) {
        console.warn('RevenueCat logOut warning:', error);
      }
    } finally {
      this.isInitialized = false;
      
      if (__DEV__) {
        console.log('RevenueCatService disconnected');
      }
    }
  }
}

export default RevenueCatService;