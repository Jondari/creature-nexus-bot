import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardRarity } from '@/models/Card';
import { ExtendedCard, isMonsterCard, isSpellCard } from '@/models/cards-extended';
import { groupByModel, CardGrouped } from '@/utils/cardUtils';
import Colors from '@/constants/Colors';
import { useSceneManager } from '@/context/SceneManagerContext';
import CardGrid from '@/components/CardGrid';
import { t } from '@/utils/i18n';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useSceneTrigger } from '@/context/SceneManagerContext';
import { useAnchorRegister } from '@/context/AnchorsContext';
import { COMMON_ANCHORS } from '@/types/scenes';
import { useAnchorPolling } from '@/hooks/useAnchorPolling';

export default function CollectionScreen() {
  const { user, getCards } = useAuth();
  const sceneManager = useSceneManager();
  const { cardSize, setCardSize } = useSettings();
  // Keep raw instances for accurate totals
  const [allCards, setAllCards] = useState<Array<Card | ExtendedCard>>([]);
  // Grouped list (unique models with a count) for fast rendering
  const groupedCards: CardGrouped[] = useMemo(() => groupByModel(allCards), [allCards]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CardRarity | 'all'>('all');
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const gridRef = useRef<View | null>(null);
  const sceneTrigger = useSceneTrigger();

  // Register anchor for the collection grid area
  useAnchorRegister(COMMON_ANCHORS.CARD_GRID, gridRef);

  useAnchorPolling([COMMON_ANCHORS.CARD_GRID], () => {
    sceneTrigger({ type: 'onEnterScreen', screen: 'collection' });
  });
  
  useEffect(() => {
    if (user) {
      fetchUserCards();
    }
  }, [user]);

  // Refetch cards when screen comes into focus (but not too frequently)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only refetch if more than 5 seconds have passed since last fetch
      if (user && (now - lastFetchTime > 5000)) {
        fetchUserCards();
      }
    }, [user, lastFetchTime])
  );
  
  const fetchUserCards = async () => {
    try {
      setLoading(true);

      if (!user) return;

      const rawCards = await getCards();
      // Store only well-formed card objects; drop any invalid entries (e.g., string IDs)
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
      // Store all owned card instances; we group them in-memory for the grid.
      setAllCards(sanitizeCards(rawCards));
      setLastFetchTime(Date.now());
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching user cards:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (newFilter: CardRarity | 'all') => {
    setFilter(newFilter);
  };
  
  if (loading) {
    return <LoadingOverlay message={t('collection.loading')} />;
  }
  
  return (
    <View style={styles.container}>
      {/* Tutorial shortcut for Collection */}
      <View style={{ position: 'absolute', top: 12, right: 22, zIndex: 1000 }}>
        <TouchableOpacity
          onPress={() => {
            try {
              sceneManager.startScene('tutorial_collection_intro');
            } catch (error) {
              if (__DEV__) {
                console.warn('[Tutorial] Failed to start scene tutorial_collection_intro', error);
              }
            }
          }}
          style={styles.tutorialButton}
        >
          <HelpCircle size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{t('collection.title')}</Text>
            {/* Show total instances owned, not grouped count */}
            <Text style={styles.subtitle}>
              {allCards.length} {t('home.cardsCollected')}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.sizeToggle}
            onPress={() => setCardSize(cardSize === 'small' ? 'normal' : 'small')}
          >
            <Text style={styles.sizeToggleText}>
              {cardSize === 'small' ? '⊞' : '⊟'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Pass grouped items so the grid only renders unique models with x{count} */}
      <View ref={gridRef as any} style={styles.gridWrapper}>
        <CardGrid
          items={groupedCards}
          filter={filter}
          onFilterChange={handleFilterChange}
          cardSize={cardSize}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  gridWrapper: {
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
  header: {
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  sizeToggle: {
    backgroundColor: Colors.background.card,
    borderRadius: 8,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeToggleText: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
});
