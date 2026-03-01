# Billing System

> Technical documentation for the in-app purchase system in Creature Nexus TCG.
> Initial implementation in v0.5.0 (August 2025), migrated to RevenueCat in v0.5.2.

---

## Overview

The billing system handles real-money purchases (packs and Nexus Coins) via RevenueCat on native platforms. Web has a stub implementation that disables purchases. The system uses a two-layer architecture: `BillingService` as the app-facing API, and `RevenueCatService` as the platform-specific backend.

---

## Architecture

| File | Role |
|------|------|
| `services/billingService.native.ts` | App-facing billing API (native) — delegates to RevenueCat |
| `services/billingService.web.ts` | App-facing billing API (web) — stub, always returns error |
| `services/RevenueCatService.native.ts` | RevenueCat SDK wrapper (native) |
| `services/RevenueCatService.web.ts` | RevenueCat stub (web) — no-op |
| `app/(tabs)/store.tsx` | Store screen — consumes BillingService |
| `app/_layout.tsx` | RevenueCat initialization at app startup |

Platform resolution is handled by React Native's `.native.ts` / `.web.ts` suffix convention.

---

## Products

| Product ID | Type |
|-----------|------|
| `standard_pack` | Pack |
| `elemental_pack` | Pack |
| `legendary_pack` | Pack |
| `mythic_pack` | Pack |
| `nexus_coins_100` | Currency |
| `nexus_coins_500` | Currency |
| `nexus_coins_1000` | Currency |

All products are non-subscription (one-time purchases) managed via Google Play.

---

## BillingService API

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize RevenueCat SDK |
| `getProducts()` | Fetch available products with localized prices |
| `getProduct(id)` | Fetch a single product by ID |
| `purchaseProduct(id)` | Initiate a purchase, returns `{ success, error?, purchaseToken? }` |
| `finishTransaction(token?)` | Finish transaction (handled automatically by RevenueCat) |
| `restorePurchases()` | Restore previous purchases |
| `getCustomerInfo()` | Get RevenueCat customer info |
| `disconnect()` | Disconnect and reset state |

### BillingProduct Interface

```typescript
interface BillingProduct {
  id: string;
  title: string;
  description: string;
  price: string;        // Localized price string from store
  priceAmount: number;  // Numeric price
  currency: string;     // Currency code
}
```

---

## RevenueCat Integration

### Initialization

RevenueCat is configured at app startup in `app/_layout.tsx`:

```typescript
const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
await Purchases.configure({ apiKey });
```

### Product Fetching

Products are fetched directly by SKU identifiers (no Offerings/Packages used):

```typescript
const storeProducts = await Purchases.getProducts(skus, INAPP_OR_NON_SUBS);
```

The `INAPP_OR_NON_SUBS` constant resolves the correct non-subscription type across RevenueCat SDK versions.

### Purchase Flow

```
User taps "Buy" in store
  → BillingService.purchaseProduct(productId)
  → RevenueCatService.purchaseProduct(productId)
  → Purchases.getProducts([productId]) → find StoreProduct
  → Purchases.purchaseStoreProduct(storeProduct)
  → Success: return { success: true, purchaseToken }
  → Failure: return { success: false, error, cancelled? }
  → Store grants items (coins/cards) to player
  → BillingService.finishTransaction() (auto-handled by RevenueCat)
```

### Error Handling

| Error Code | Message |
|-----------|---------|
| `PRODUCT_ALREADY_PURCHASED` | Product already purchased |
| `PURCHASE_INVALID_ERROR` | Purchase invalid |
| `PRODUCT_NOT_AVAILABLE` | Product not available |
| User cancelled | User cancelled |

---

## Platform Behavior

### Native (Android)

- Full RevenueCat integration with Google Play billing
- Products fetched with localized pricing from the store
- Real purchase transactions via `Purchases.purchaseStoreProduct()`
- Debug logging in `__DEV__` mode (`LOG_LEVEL.DEBUG`)

### Web

- All methods are stubs returning empty/error results
- `purchaseProduct()` always returns `{ success: false, error: 'In-app purchases are not available on web.' }`
- Store screen shows coin-only pricing (no real-money buttons)

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | RevenueCat Android API key |

---

## i18n Keys

| Key | EN | FR |
|-----|----|----|
| `store.purchaseFailed` | Purchase Failed | Achat échoué |
| `store.purchaseFailedGeneric` | Failed to purchase pack. Please try again. | Échec de l'achat du pack. Réessayez. |
| `store.purchaseSuccessTitle` | Purchase Successful! | Achat réussi ! |
| `store.purchaseSuccessRealMoney` | You purchased {{name}} for {{price}}! | Vous avez acheté {{name}} pour {{price}} ! |
| `store.purchaseSuccessCards` | You received {{count}} new cards from {{name}}! | Vous avez reçu {{count}} nouvelles cartes de {{name}} ! |
| `store.purchaseFailedComplete` | Failed to complete purchase. | Échec de la finalisation de l'achat. |

---

*Last updated: February 2026*
