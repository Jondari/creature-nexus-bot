import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Linking, Image } from 'react-native';
import { useAuth, type InventoryPack } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { canOpenNewPack, getTimeUntilNextPack } from '@/utils/cardUtils';
import { generatePackCards } from '@/utils/boosterUtils';
import { FREE_DAILY_PACK, getPackById } from '@/data/boosterPacks';
import { Card } from '@/models/Card';
import { ExtendedCard, isMonsterCard, isSpellCard } from '@/models/cards-extended';
import { PackageOpen, Gift, HelpCircle } from 'lucide-react-native';
import { t } from '@/utils/i18n';
import Colors from '@/constants/Colors';
import CountdownTimer from '@/components/CountdownTimer';
import PackOpeningAnimation from '@/components/Animation/PackOpeningAnimation';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useFocusEffect } from '@react-navigation/native';
import { NotificationService } from '@/services/notificationService';
import { Sidebar } from '@/components/Sidebar';
import { useAnchorRegister } from '@/context/AnchorsContext';
import { COMMON_ANCHORS } from '@/types/scenes';
import { useSceneTrigger, useSceneManager } from '@/context/SceneManagerContext';
import { useAnchorPolling } from '@/hooks/useAnchorPolling';

// Helper: format a user-friendly relative time (e.g., "3 hours ago")
const formatRelativeDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hrs = Math.floor(min / 60);
    const days = Math.floor(hrs / 24);

    if (sec < 45) return t('time.justNow');
    if (sec < 90) return t('time.minuteAgo');
    if (min < 45) return t('time.minutesAgo', { count: String(min) });
    if (min < 90) return t('time.hourAgo');
    if (hrs < 24) return t('time.hoursAgo', { count: String(hrs) });
    if (hrs < 48) return t('time.yesterday');
    if (days < 7) return t('time.daysAgo', { count: String(days) });

    // 7+ days: show a concise date
    return date.toLocaleDateString(undefined, {
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return new Date(isoString).toLocaleString();
  }
};

// Helper: sort packs by earnedAt descending (newest first)
const sortInventoryPacks = (packs: InventoryPack[]): InventoryPack[] => {
  return [...packs].sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
};

export default function OpenPackScreen() {
  const { user, getCards, addCards, getPacks, removePack: removePackFromInventory, getLastFreePack, setLastFreePack } = useAuth();
  const sceneTrigger = useSceneTrigger();
  const sceneManager = useSceneManager();
  const [cards, setCards] = useState<Array<Card | ExtendedCard>>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showPackResults, setShowPackResults] = useState(false);
  const [packResults, setPackResults] = useState<Card[]>([]);
  const [inventoryPacks, setInventoryPacks] = useState<InventoryPack[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const giftRef = useRef<TouchableOpacity | null>(null);
  const openPackRef = useRef<TouchableOpacity | null>(null);

  // Register an anchor for the packs inventory (gift button)
  useAnchorRegister(COMMON_ANCHORS.PACK_INVENTORY, giftRef);
  useAnchorRegister(COMMON_ANCHORS.OPEN_PACK_BUTTON, openPackRef);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Initialize notifications when component mounts
  useEffect(() => {
    // Setup notification handlers (for mobile)
    NotificationService.setupNotificationHandlers();
  }, []);

  useAnchorPolling(
    [COMMON_ANCHORS.OPEN_PACK_BUTTON, COMMON_ANCHORS.PACK_INVENTORY],
    () => {
      sceneTrigger({ type: 'onEnterScreen', screen: 'home' });
    }
  );

  // Refresh data when the tab comes into focus (e.g., after purchasing from store)
  useFocusEffect(
    React.useCallback(() => {
      // Trigger onFirstLaunch cleanly on the home screen,
      // after a short delay to let the splash and layout finish.
      const t = setTimeout(() => {
        try {
          const running = sceneManager.getCurrentScene?.();
          const alreadyDone = sceneManager.isSceneCompleted?.('tutorial_first_launch');
          if (!running && !alreadyDone) {
            sceneTrigger({ type: 'onFirstLaunch' });
          }
        } catch (e) {
          if (__DEV__) console.warn('[Home] onFirstLaunch trigger skipped:', e);
        }
      }, 450);

      const now = Date.now();
      // Only refetch if more than 5 seconds have passed since last fetch
      if (user && (now - lastFetchTime > 5000)) {
        fetchUserData();
      }
      return () => clearTimeout(t);
    }, [user, lastFetchTime, sceneManager, sceneTrigger])
  );
  
  const fetchUserData = async () => {
    try {
      setLoading(true);

      if (!user) return;

      // Fetch cards via context
      const rawCards = await getCards();
      const sanitizeCards = (cards: any): Array<Card | ExtendedCard> => {
        if (!Array.isArray(cards)) return [];
        return cards.filter((c: any) => (
          c && typeof c === 'object' &&
          typeof c.id === 'string' &&
          typeof c.name === 'string' &&
          typeof c.rarity === 'string' &&
          typeof c.element === 'string' &&
          (isMonsterCard(c) || isSpellCard(c))
        ));
      };
      setCards(sanitizeCards(rawCards));

      // Check if we can open a new pack
      const lastPackOpenedTimestamp = await getLastFreePack();
      if (lastPackOpenedTimestamp) {
        if (!canOpenNewPack(lastPackOpenedTimestamp)) {
          const remaining = getTimeUntilNextPack(lastPackOpenedTimestamp);
          setTimeRemaining(remaining);
        }
      } else {
        // First time user - request permission gracefully
        requestNotificationPermissionGracefully();
      }

      // Load inventory packs
      const userInventoryPacks = await getPacks();
      setInventoryPacks(sortInventoryPacks(userInventoryPacks));
      setLastFetchTime(Date.now());
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching user data:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenPack = async () => {
    try {
      if (!user) return;

      setOpening(true);

      // Generate a new free daily pack using the booster system
      const newCards = generatePackCards(FREE_DAILY_PACK);

      // Save cards and update last pack timestamp via context
      await addCards(newCards);
      await setLastFreePack(Date.now());

      // Update local state
      setCards((prevCards) => [...prevCards, ...newCards]);
      setPackResults(newCards);
      setShowPackResults(true);

      // Set the cooldown timer
      setTimeRemaining(12 * 60 * 60 * 1000); // 12 hours in milliseconds

      // Schedule notification for next pack
      const currentTimestamp = Date.now();
      await NotificationService.scheduleNextPackNotification(currentTimestamp);
    } catch (error) {
      if (__DEV__) {
        console.error('Error opening pack:', error);
      }
    } finally {
      setOpening(false);
    }
  };

  const handleOpenInventoryPack = async (inventoryPack: InventoryPack) => {
    try {
      if (!user) return;

      setOpening(true);

      // Get pack definition
      const packDef = getPackById(inventoryPack.packId);
      if (!packDef) {
        if (__DEV__) {
          console.error(`Pack ${inventoryPack.packId} not found`);
        }
        return;
      }

      // Generate cards using the booster system
      const newCards = generatePackCards(packDef);

      // Save cards and remove pack via context
      await addCards(newCards);
      await removePackFromInventory(inventoryPack);

      // Update local state
      setCards((prevCards) => [...prevCards, ...newCards]);
      setPackResults(newCards);
      setShowPackResults(true);

      // Refresh inventory
      const updatedInventory = await getPacks();
      setInventoryPacks(sortInventoryPacks(updatedInventory));
    } catch (error) {
      if (__DEV__) {
        console.error('Error opening inventory pack:', error);
      }
    } finally {
      setOpening(false);
    }
  };
  
  const handlePackOpeningComplete = () => {
    setShowPackResults(false);
  };

  // Helper function to handle notification permission and scheduling
  const handleNotificationSetup = async (lastPackOpenedTimestamp: number) => {
    try {
      // Check if we should request permission
      if (NotificationService.shouldRequestPermission()) {
        const permission = await NotificationService.requestPermission();
        
        if (__DEV__) {
          console.log('Notification permission:', permission.status);
        }
      }

      // Schedule notification for next pack if permission granted
      await NotificationService.scheduleNextPackNotification(lastPackOpenedTimestamp);
    } catch (error) {
      if (__DEV__) {
        console.error('Error setting up notifications:', error);
      }
    }
  };

  // Helper function to gracefully request notification permission for new users
  const requestNotificationPermissionGracefully = async () => {
    try {
      // Only request permission if we haven't asked before
      if (NotificationService.shouldRequestPermission()) {
        // Small delay to not interrupt the initial loading experience
        setTimeout(async () => {
          const permission = await NotificationService.requestPermission();
          
          if (__DEV__) {
            console.log('Initial notification permission request:', permission.status);
          }
        }, 2000); // 2 second delay
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  
  const handleRefresh = () => {
    fetchUserData();
  };
  
  if (loading) {
    return <LoadingOverlay message={t('home.loading')} />;
  }
  
  return (
    <View style={styles.container}>
      {/* Tutorial shortcut for the home screen. */}
      <View style={{ position: 'absolute', top: 12, right: 22, zIndex: 1000 }}>
        <TouchableOpacity
          onPress={() => {
            try {
              sceneManager.startScene('tutorial_home_intro');
            } catch (error) {
              if (__DEV__) {
                console.warn('[Tutorial] Failed to start scene tutorial_home_intro', error);
              }
            }
          }}
          style={styles.tutorialButton}
        >
          <HelpCircle size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
      <LinearGradient
        colors={[Colors.primary[900], Colors.background.primary]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>{t('home.title')}</Text>
              <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
            </View>
            <TouchableOpacity
              style={styles.giftButton}
              onPress={() => setSidebarVisible(true)}
              activeOpacity={0.8}
              ref={giftRef as any}
            >
              <Gift size={22} color={Colors.text.primary} />
              {inventoryPacks.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {inventoryPacks.length > 99 ? '99+' : inventoryPacks.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {timeRemaining > 0 ? (
          <CountdownTimer 
            timeRemaining={timeRemaining} 
            onComplete={handleRefresh}
          />
        ) : (
          <View style={styles.packContainer}>
            <TouchableOpacity
              style={styles.packButton}
              onPress={handleOpenPack}
              disabled={opening || timeRemaining > 0}
              activeOpacity={0.8}
              ref={openPackRef as any}
            >
              <LinearGradient
                colors={[Colors.accent[700], Colors.accent[500]]}
                style={styles.packButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <PackageOpen size={32} color={Colors.text.primary} />
                <Text style={styles.packButtonText}>{t('home.openPack')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.packInfo}>{t('home.packContains')}</Text>
          </View>
        )}
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{cards.length}</Text>
            <Text style={styles.statLabel}>{t('home.cardsCollected')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.floor(cards.length / 5)}</Text>
            <Text style={styles.statLabel}>{t('home.packsOpened')}</Text>
          </View>
        </View>

        {/* A supprimer */}
        {__DEV__ && (
            <TouchableOpacity onPress={handleOpenPack} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ color: 'orange', fontWeight: 'bold' }}>
                {t('home.forceOpenDev')}
              </Text>
            </TouchableOpacity>
        )}


        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>{t('home.cardRarities')}</Text>
          <View style={styles.rarityList}>
            {['common', 'rare', 'epic', 'legendary', 'mythic'].map((rarity) => (
              <View key={rarity} style={styles.rarityItem}>
                <View 
                  style={[
                    styles.rarityDot, 
                    { backgroundColor: Colors[rarity as keyof typeof Colors] as string }
                  ]}
                />
                <Text style={styles.rarityText}>{t(`rarities.${rarity}`)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {opening && <LoadingOverlay message={t('store.opening')} />}
      
      {showPackResults && (
        <PackOpeningAnimation
          cards={packResults}
          onComplete={handlePackOpeningComplete}
        />
      )}

      {/* Packs Sidebar */}
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} title={t('home.myPacks')} width={380}>
        <ScrollView contentContainerStyle={styles.sidebarContent}>
          {inventoryPacks.length === 0 ? (
            <Text style={styles.emptySidebarText}>{t('home.noUnopenedPacks')}</Text>
          ) : (
            inventoryPacks.map((inv) => {
              const pack = getPackById(inv.packId);
              return (
                <View key={`${inv.packId}_${inv.earnedAt}`} style={styles.packItem}>
                  {pack?.imageUrl ? (
                    <Image source={pack.imageUrl as any} style={styles.packItemImage} resizeMode="contain" />
                  ) : (
                    <View style={[styles.packItemImage, { alignItems: 'center', justifyContent: 'center' }]}> 
                      <Text style={{ color: Colors.text.secondary, fontSize: 12 }}>{t('home.noImage')}</Text>
                    </View>
                  )}
                  <View style={styles.packItemInfo}>
                    <Text style={styles.packItemName}>{inv.packName}</Text>
                    <Text style={styles.packItemEarnedAt}>
                      {t('home.earned', { when: formatRelativeDate(inv.earnedAt) })}
                    </Text>
                    <TouchableOpacity
                      style={styles.openPackButton}
                      onPress={() => handleOpenInventoryPack(inv)}
                      disabled={opening}
                    >
                      <Text style={styles.openPackButtonText}>{opening ? t('store.opening') : t('common.open')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </Sidebar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tutorialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    marginTop: 60,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  giftButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#ff4757',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  packContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  packButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: 16,
  },
  packButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packButtonText: {
    marginTop: 8,
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
  },
  packInfo: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '45%',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: Colors.accent[500],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  infoContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
  },
  sidebarContent: {
    padding: 12,
    gap: 10,
  },
  packItem: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 10,
    padding: 10,
    gap: 10,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  packItemImage: {
    width: 64,
    height: 64,
  },
  packItemInfo: {
    flex: 1,
  },
  packItemName: {
    color: Colors.text.primary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  packItemEarnedAt: {
    color: Colors.text.secondary,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  openPackButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent[600],
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  openPackButtonText: {
    color: Colors.text.primary,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  rarityList: {
    marginTop: 8,
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  rarityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
});
