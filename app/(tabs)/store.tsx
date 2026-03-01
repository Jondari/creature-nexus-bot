import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Platform, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, ShoppingCart, Star, Zap, HelpCircle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import LoadingOverlay from '@/components/LoadingOverlay';
import { t } from '@/utils/i18n';
import PackOpeningAnimation from '@/components/Animation/PackOpeningAnimation';
import { PACK_CATEGORIES, getAvailablePacks, BoosterPack } from '@/data/boosterPacks';
import { UserCurrency } from '@/models/BoosterPack';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '@/utils/alerts';
import { generatePackCards } from '@/utils/boosterUtils';
import { BillingService } from '@/services/billingService';
import { isDemoMode } from '@/config/localMode';
import { useSceneTrigger, useSceneManager } from '@/context/SceneManagerContext';
import { useAnchorRegister } from '@/context/AnchorsContext';
import { COMMON_ANCHORS } from '@/types/scenes';
import { useAnchorPolling } from '@/hooks/useAnchorPolling';

const { width } = Dimensions.get('window');
const isWideScreen = width >= 768; // Tablet/desktop breakpoint

export default function StoreScreen() {
  const { user, getCoins, spendCoins, addCoins, addCards } = useAuth();
  const sceneManager = useSceneManager();
  const coinRef = useRef<View | null>(null);
  const packGridRef = useRef<View | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCurrency, setUserCurrency] = useState<UserCurrency>({ nexusCoins: 0 });
  const [selectedCategory, setSelectedCategory] = useState<'standard' | 'elemental' | 'premium'>('standard');
  const [showPackResults, setShowPackResults] = useState(false);
  const [packResults, setPackResults] = useState<any[]>([]);
  const [currentPackName, setCurrentPackName] = useState<string>('');
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [realPrices, setRealPrices] = useState<Record<string, string>>({});
  const sceneTrigger = useSceneTrigger();

  // Register anchors for tutorial highlights in Store
  useAnchorRegister(COMMON_ANCHORS.COIN_BALANCE, coinRef);
  useAnchorRegister(COMMON_ANCHORS.PACK_SHOP, packGridRef);

  useEffect(() => {
    if (user) {
      fetchUserCurrency();
      if (!isDemoMode) {
        fetchRealPrices(); // Load real prices from RevenueCat
      }
    }
  }, [user]);

  useAnchorPolling([
    COMMON_ANCHORS.COIN_BALANCE,
    COMMON_ANCHORS.PACK_SHOP,
  ], () => {
    sceneTrigger({ type: 'onEnterScreen', screen: 'store' });
  });

  // Refresh currency when the tab comes into focus (e.g., after using dev tools to add coins)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only refetch if more than 5 seconds have passed since last fetch
      if (user && (now - lastFetchTime > 5000)) {
        fetchUserCurrency();
      }
    }, [user, lastFetchTime])
  );

  const fetchRealPrices = async () => {
    try {
      await BillingService.initialize();
      const products = await BillingService.getProducts();
      
      const priceMap: Record<string, string> = {};
      products.forEach(product => {
        priceMap[product.id] = product.price;
      });
      
      setRealPrices(priceMap);
    } catch (error) {
      if (__DEV__) {
        console.log('Failed to fetch real prices, using fallback:', error);
        // Keep realPrices empty to use fallback
      }
    }
  };

  const fetchUserCurrency = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const coins = await getCoins();
      setUserCurrency({ nexusCoins: coins });
      setLastFetchTime(Date.now());
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching user currency:', error);
      }
      showErrorAlert(t('common.error'), t('store.errorLoadCurrency'));
    } finally {
      setLoading(false);
    }
  };

  const executePurchase = async (pack: BoosterPack, quantity: number, totalCost: number) => {
    try {
      if (!user) return;

      const success = await spendCoins(totalCost);

      if (success) {
        try {
          // Generate cards but don't show success message yet
          const allNewCards = [];

          // Check if this is a bundle purchase and calculate total packs (including bonus)
          let totalPacksToGenerate = quantity;
          if (pack.bundleDiscount && quantity === pack.bundleDiscount.quantity) {
            // This is a bundle purchase, add the bonus packs
            totalPacksToGenerate = quantity + pack.bundleDiscount.bonus;
          }

          for (let i = 0; i < totalPacksToGenerate; i++) {
            const packCards = generatePackCards(pack);
            allNewCards.push(...packCards);
          }

          // Add cards to user collection via context
          await addCards(allNewCards);

          // Show pack opening animation
          setCurrentPackName(`${pack.name}${totalPacksToGenerate > 1 ? ` x${totalPacksToGenerate}` : ''}`);
          setPackResults(allNewCards);
          setShowPackResults(true);

          // Refresh currency display
          await fetchUserCurrency();
        } catch (packError) {
          // Something failed after payment - refund the coins
          if (__DEV__) {
            console.error('Error after payment, refunding coins:', packError);
          }
          try {
            await addCoins(totalCost);
            await fetchUserCurrency(); // Refresh to show refund
            showErrorAlert(t('store.purchaseFailed'), t('store.packOpenFailedRefunded'));
          } catch (refundError) {
            if (__DEV__) {
              console.error('Error refunding coins:', refundError);
            }
            showErrorAlert(t('store.purchaseFailed'), t('store.packOpenFailedRefundFailed'));
          }
        }
      } else {
        showErrorAlert(t('store.purchaseFailed'), t('store.txnFailedTryAgain'));
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error executing purchase:', error);
      }
      showErrorAlert(t('store.purchaseFailed'), t('store.purchaseFailedGeneric'));
    }
  };

  const handlePurchasePack = async (pack: BoosterPack, quantity: number = 1) => {
    try {
      const totalCost = pack.nexusCoinPrice * quantity;
      
      if (userCurrency.nexusCoins < totalCost) {
        showErrorAlert(
          'Insufficient Nexus Coins',
          `You need ${totalCost} Nexus Coins but only have ${userCurrency.nexusCoins}.`
        );
        return;
      }

      showConfirmAlert(
        t('store.confirmPurchaseTitle'),
        t('store.confirmPurchaseCoins', { quantity: String(quantity), name: pack.name, plural: quantity > 1 ? 's' : '', cost: String(totalCost) }),
        () => {
          // Call the async purchase function without making the callback async
          executePurchase(pack, quantity, totalCost);
        }
      );

    } catch (error) {
      if (__DEV__) {
        console.error('Error purchasing pack:', error);
      }
      showErrorAlert(t('store.purchaseFailed'), t('store.purchaseFailedGeneric'));
    }
  };

  // Map pack IDs to product IDs
  const getProductId = (packId: string): string => {
    switch (packId) {
      case 'standard_pack':
        return BillingService.PRODUCT_IDS.STANDARD_PACK;
      case 'fire_pack':
      case 'water_pack':
      case 'earth_pack':
      case 'air_pack':
        return BillingService.PRODUCT_IDS.ELEMENTAL_PACK;
      case 'legendary_guaranteed_pack':
        return BillingService.PRODUCT_IDS.LEGENDARY_PACK;
      case 'mythic_guaranteed_pack':
        return BillingService.PRODUCT_IDS.MYTHIC_PACK;
      default:
        return BillingService.PRODUCT_IDS.STANDARD_PACK;
    }
  };

  const getDisplayPrice = (pack: BoosterPack): string => {
    const productId = getProductId(pack.id);
    
    // Try to use real RevenueCat price first
    if (realPrices[productId]) {
      return realPrices[productId];
    }
    
    // Fallback to localized hardcoded price
    if (pack.realMoneyPrice) {
      const price = pack.realMoneyPrice / 100;
      
      // Get locale in a platform-safe way
      const getDeviceLocale = (): string => {
        if (Platform.OS === 'web') {
          // For web, use browser locale
          return navigator.language || 'en-US';
        } else {
          // For native platforms, try to use expo-localization safely
          try {
            const Localization = require('expo-localization');
            return Localization.locale || Localization.locales?.[0] || 'en-US';
          } catch (error) {
            // Fallback if expo-localization is not available
            return 'en-US';
          }
        }
      };
      
      const locale = getDeviceLocale();
      
      // Determine currency based on region
      const getCurrencyFromLocale = (locale: string): string => {
        const region = locale.split('-')[1] || locale.split('_')[1];
        switch (region?.toUpperCase()) {
          case 'US':
          case 'CA':
            return 'USD';
          case 'GB':
            return 'GBP';
          case 'JP':
            return 'JPY';
          case 'AU':
            return 'AUD';
          default:
            return 'EUR'; // Default to EUR for EU and other regions
        }
      };
      
      const currency = getCurrencyFromLocale(locale);
      
      // Use proper locale-aware currency formatting
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
        }).format(price);
      } catch (error) {
        // Fallback if Intl is not supported
        return `€${price.toFixed(2)}`;
      }
    }
    
    return 'N/A';
  };

  const handleRealMoneyPurchase = async (pack: BoosterPack) => {
    if (!user) return;

    // Check if billing is supported on this platform
    if (Platform.OS === 'web') {
      showErrorAlert(t('store.notAvailableTitle'), t('store.notAvailableDesc'));
      return;
    }

    try {
      setLoading(true);

      const productId = getProductId(pack.id);
      
      // Initialize billing service
      await BillingService.initialize();
      
      // Get product details to show current price
      const product = await BillingService.getProduct(productId);
      if (!product) {
        showErrorAlert(t('common.error'), t('store.productUnavailable'));
        return;
      }

      // Show confirmation with real price
      showConfirmAlert(
        t('store.confirmPurchaseTitle'),
        t('store.confirmPurchaseRealMoney', { name: pack.name, price: String(product.price) }),
        async () => {
          const result = await BillingService.purchaseProduct(productId);

          if (result.success) {
            // Purchase successful - grant the pack to the user
            const packCards = generatePackCards(pack);

            // Add cards to collection via context
            await addCards(packCards);

            // Finish the transaction
            if (result.purchaseToken) {
              await BillingService.finishTransaction(result.purchaseToken);
            }

            // Show pack results
            setPackResults(packCards);
            setCurrentPackName(pack.name);
            setShowPackResults(true);

            showSuccessAlert(t('store.purchaseSuccessTitle'), t('store.purchaseSuccessRealMoney', { name: pack.name, price: String(product.price) }));
          } else {
            showErrorAlert(t('store.purchaseFailed'), result.error || t('store.purchaseFailedComplete'));
          }
        }
      );
    } catch (error) {
      if (__DEV__) {
        console.error('Real money purchase error:', error);
      }
      showErrorAlert(t('common.error'), t('store.processPurchaseFailed'));
    } finally {
      setLoading(false);
    }
  };

  const renderPackCard = (pack: BoosterPack) => {
    const isFree = pack.nexusCoinPrice === 0;
    
    return (
      <View key={pack.id} style={styles.packCard}>
        <LinearGradient
          colors={[pack.backgroundColor, `${pack.backgroundColor}88`]}
          style={styles.packGradient}
        >

          <View style={styles.packHeader}>
            <Text style={styles.packName}>
              {(() => { const k = `packs.${pack.id}.name`; const v = t(k); return v === k ? pack.name : v; })()}
            </Text>
            {pack.isPremium && <Star size={16} color="#ffd700" />}
          </View>
          
          <Text style={styles.packDescription}>
            {(() => { const k = `packs.${pack.id}.desc`; const v = t(k); return v === k ? pack.description : v; })()}
          </Text>
          
          <View style={styles.packDetails}>
            <Text style={styles.cardCount}>{t('packs.cardCount', { count: String(pack.cardCount) })}</Text>
            {pack.guaranteedRarity && (
              <Text style={styles.guaranteed}>
                {t('packs.guaranteed', { rarity: t(`rarities.${pack.guaranteedRarity}`) })}
              </Text>
            )}
          </View>

          {/* Pack Image */}
          {pack.imageUrl && (
              <Image
                  source={pack.imageUrl}
                  style={styles.packImage}
                  resizeMode="contain"
                  onError={(error) => { if (__DEV__) {console.log('Pack image failed to load:', pack.imageUrl, error)}}}
              />
          )}

          {!isFree ? (
            <View style={styles.packPricing}>
              {/* Nexus Coin Purchase */}
              <TouchableOpacity
                style={styles.coinPurchaseButton}
                onPress={() => handlePurchasePack(pack)}
              >
                <View style={styles.priceRow}>
                  <Coins size={16} color="#ffd700" />
              <Text style={styles.coinPrice}>{pack.nexusCoinPrice}</Text>
                </View>
              </TouchableOpacity>

              {/* Real Money Purchase (hidden in demo mode) */}
              {!isDemoMode && pack.realMoneyPrice && (
                <TouchableOpacity
                  style={styles.moneyPurchaseButton}
                  onPress={() => handleRealMoneyPurchase(pack)}
                >
                  <Text style={styles.moneyPrice}>{getDisplayPrice(pack)}</Text>
                </TouchableOpacity>
              )}

              {/* Bundle Option */}
              {pack.bundleDiscount && (
                <TouchableOpacity
                  style={styles.bundleButton}
                  onPress={() => handlePurchasePack(pack, pack.bundleDiscount!.quantity)}
                >
                  <Text style={styles.bundleText}>
                    {t('store.bundleOffer', { quantity: String(pack.bundleDiscount.quantity), bonus: String(pack.bundleDiscount.bonus) })}
                  </Text>
                  <View style={styles.priceRow}>
                    <Coins size={14} color="#ffd700" />
                    <Text style={styles.bundlePrice}>
                      {pack.nexusCoinPrice * pack.bundleDiscount.quantity}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.freePurchaseButton}
              onPress={() => handlePurchasePack(pack)}
            >
              <Text style={styles.freePurchaseText}>{t('store.claimFreePack')}</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderCategory = (category: 'standard' | 'elemental' | 'premium', title: string, icon: any) => {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        style={[styles.categoryButton, isSelected && styles.categoryButtonActive]}
        onPress={() => setSelectedCategory(category)}
      >
        {icon}
        <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const handlePackOpeningComplete = () => {
    setShowPackResults(false);
    showSuccessAlert(t('store.purchaseSuccessTitle'), t('store.purchaseSuccessCards', { count: String(packResults.length), name: currentPackName }));
  };

  if (loading) {
    return <LoadingOverlay message={t('store.loading')} />;
  }

  return (
    <View style={styles.container}>
      {/* Tutorial shortcut for Store */}
      <View style={{ position: 'absolute', top: 14, left: 320, zIndex: 1000 }}>
        <TouchableOpacity
          onPress={() => {
            try {
              sceneManager.startScene('tutorial_store_intro');
            } catch (error) {
              if (__DEV__) {
                console.warn('[Tutorial] Failed to start scene tutorial_store_intro', error);
              }
            }
          }}
          style={styles.tutorialButton}
        >
          <HelpCircle size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('store.title')}</Text>
        <View style={styles.currencyDisplay} ref={coinRef as any}>
          <Coins size={20} color="#ffd700" />
          <Text style={styles.currencyAmount}>{userCurrency.nexusCoins}</Text>
        </View>
      </View>

      {/* Category Selection */}
      <View style={styles.categoryContainer}>
        {renderCategory('standard', t('store.standard'), <ShoppingCart size={16} color={selectedCategory === 'standard' ? Colors.text.primary : Colors.text.secondary} />)}
        {renderCategory('elemental', t('store.elemental'), <Zap size={16} color={selectedCategory === 'elemental' ? Colors.text.primary : Colors.text.secondary} />)}
        {renderCategory('premium', t('store.premium'), <Star size={16} color={selectedCategory === 'premium' ? Colors.text.primary : Colors.text.secondary} />)}
      </View>

      {/* Pack Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.packsGrid} ref={packGridRef as any}>
          {PACK_CATEGORIES[selectedCategory].map(renderPackCard)}
        </View>
      </ScrollView>

      {/* Pack Opening Animation */}
      {showPackResults && (
        <PackOpeningAnimation
          cards={packResults}
          onComplete={handlePackOpeningComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[700],
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  currencyAmount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: Colors.accent[500],
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
  categoryTextActive: {
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  packsGrid: {
    padding: 20,
    gap: 16,
    // Apply row layout only on web AND wide screens
    ...(Platform.OS === 'web' && isWideScreen && {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'stretch',
    }),
  },
  packCard: {
    borderRadius: 12,
    // Apply width constraints only on web AND wide screens
    ...(Platform.OS === 'web' && isWideScreen && {
      width: '32%',
      minWidth: 300,
    }),
  },
  packGradient: {
    padding: 16,
    borderRadius: 12,
    flex: 1,
    overflow: 'hidden',
  },
  packImage: {
    width: '100%',
    height: 240,
    marginBottom: 12,
    borderRadius: 8,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  packName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
  },
  packDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  packDetails: {
    marginBottom: 16,
  },
  cardCount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  guaranteed: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffd700',
    marginTop: 4,
  },
  packPricing: {
    gap: 8,
  },
  coinPurchaseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  moneyPurchaseButton: {
    backgroundColor: Colors.accent[500],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bundleButton: {
    backgroundColor: 'rgba(45, 212, 191, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2dd4bf',
  },
  freePurchaseButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coinPrice: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  moneyPrice: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  bundleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2dd4bf',
    textAlign: 'center',
    marginBottom: 4,
  },
  bundlePrice: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  freePurchaseText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  tutorialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
