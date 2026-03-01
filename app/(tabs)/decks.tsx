import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useDecks } from '@/context/DeckContext';
import { Card } from '@/models/Card';
import { ExtendedCard, isMonsterCard, isSpellCard } from '@/models/cards-extended';
import { DeckBuilder } from '@/components/DeckBuilder';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '@/utils/alerts';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';
import { useSceneTrigger, useSceneManager } from '@/context/SceneManagerContext';
import { useAnchorRegister } from '@/context/AnchorsContext';
import { COMMON_ANCHORS } from '@/types/scenes';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useAnchorPolling } from '@/hooks/useAnchorPolling';

export default function DecksScreen() {
  const { user, getCards } = useAuth();
  const sceneManager = useSceneManager();
  const { setFlag } = sceneManager;
  const { savedDecks, activeDeck, saveDeck, deleteDeck, setActiveDeck } = useDecks();
  const [userCards, setUserCards] = useState<Array<Card | ExtendedCard>>([]);
  const [loading, setLoading] = useState(true);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [editingDeck, setEditingDeck] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const sceneTrigger = useSceneTrigger();
  const createButtonRef = useRef<TouchableOpacity | null>(null);

  useAnchorRegister(COMMON_ANCHORS.DECK_BUILDER_ENTRY, createButtonRef);

  useEffect(() => {
    setFlag('deck_builder_open', showDeckBuilder);
  }, [showDeckBuilder, setFlag]);

  useEffect(() => {
    if (user) {
      fetchUserCards();
    }
  }, [user]);

  // Refresh data when the tab comes into focus (e.g., after purchasing from store)
  useAnchorPolling([COMMON_ANCHORS.DECK_BUILDER_ENTRY], () => {
    sceneTrigger({ type: 'onEnterScreen', screen: 'decks' });
  });

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
      // Keep only well-formed card objects; drop invalid entries (e.g., string IDs)
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
      setUserCards(sanitizeCards(rawCards));
      setLastFetchTime(Date.now());
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching user cards:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = () => {
    setEditingDeck(null);
    setShowDeckBuilder(true);
  };

  const handleEditDeck = (deck: any) => {
    setEditingDeck(deck);
    setShowDeckBuilder(true);
  };

  const handleSaveDeck = async (cards: Array<Card | ExtendedCard>, deckName: string) => {
    try {
      await saveDeck(cards, deckName, editingDeck?.id);
      setShowDeckBuilder(false);
      setEditingDeck(null);
      showSuccessAlert(t('common.success'), t('alerts.deckSaved'));
    } catch (error) {
      showErrorAlert(t('common.error'), t('alerts.errorSaveDeck'));
    }
  };

  const handleDeleteDeck = (deck: any) => {
    showConfirmAlert(
      t('decks.confirmDelete.title'),
      t('decks.confirmDelete.message', { name: String(deck.name) }),
      async () => {
        try {
          await deleteDeck(deck.id);
          showSuccessAlert(t('common.success'), t('alerts.deckDeleted'));
        } catch (error) {
          showErrorAlert(t('common.error'), t('alerts.errorDeleteDeck'));
        }
      },
      undefined, // onCancel
      t('decks.confirmDelete.confirm'),
      t('decks.confirmDelete.cancel')
    );
  };

  const handleSetActiveDeck = async (deck: any) => {
    try {
      await setActiveDeck(deck.id);
      showSuccessAlert(t('common.success'), t('alerts.setActive', { name: String(deck.name) }));
    } catch (error) {
      showErrorAlert(t('common.error'), t('alerts.errorSetActive'));
    }
  };

  if (loading) {
    return <LoadingOverlay message={t('decks.loading')} />;
  }

  if (showDeckBuilder) {
    return (
      <DeckBuilder
        availableCards={userCards}
        onSaveDeck={handleSaveDeck}
        onClose={() => {
          setShowDeckBuilder(false);
          setEditingDeck(null);
        }}
        initialDeck={editingDeck?.cards || []}
        deckName={editingDeck?.name || ''}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Tutorial shortcut for Deck Builder */}
      <View style={{ position: 'absolute', top: 12, right: 22, zIndex: 1000 }}>
        <TouchableOpacity
          onPress={() => {
            try {
              sceneManager.startScene('tutorial_deck_builder');
            } catch (error) {
              if (__DEV__) {
                console.warn('[Tutorial] Failed to start scene tutorial_deck_builder', error);
              }
            }
          }}
          style={styles.tutorialButton}
        >
          <HelpCircle size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>{t('decks.title')}</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateDeck}
          ref={createButtonRef as any}
        >
          <Text style={styles.createButtonText}>{t('decks.newDeck')}</Text>
        </TouchableOpacity>
      </View>

      {activeDeck && (
        <View style={styles.activeDeckSection}>
          <Text style={styles.sectionTitle}>{t('decks.activeDeck')}</Text>
          <View style={[styles.deckCard, styles.activeDeckCard]}>
            <View style={styles.deckInfo}>
              <Text style={styles.deckName}>{activeDeck.name}</Text>
              <Text style={styles.deckStats}>
                {activeDeck.cards.length} cards
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditDeck(activeDeck)}
            >
              <Text style={styles.editButtonText}>{t('decks.edit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.allDecksSection}>
        <Text style={styles.sectionTitle}>{t('decks.allDecks', { count: String(savedDecks.length) })}</Text>
        
        {savedDecks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('decks.emptyTitle')}</Text>
            <Text style={styles.emptySubtext}>
              {t('decks.emptySubtitle')}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.decksList}>
            {savedDecks.map((deck) => (
              <View key={deck.id} style={styles.deckCard}>
                <View style={styles.deckInfo}>
                  <Text style={styles.deckName}>{deck.name}</Text>
                  <Text style={styles.deckStats}>
                    {deck.cards.length} cards
                  </Text>
                  <Text style={styles.deckDate}>
                    {t('decks.updatedAt', { date: deck.updatedAt.toLocaleDateString() })}
                  </Text>
                </View>
                
                <View style={styles.deckActions}>
                  {activeDeck?.id !== deck.id && (
                    <TouchableOpacity
                      style={styles.setActiveButton}
                      onPress={() => handleSetActiveDeck(deck)}
                    >
                      <Text style={styles.setActiveButtonText}>{t('decks.setActive')}</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditDeck(deck)}
                  >
                    <Text style={styles.editButtonText}>{t('decks.edit')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDeck(deck)}
                  >
                    <Text style={styles.deleteButtonText}>{t('decks.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
  },
  createButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  activeDeckSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  allDecksSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  deckCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeDeckCard: {
    borderWidth: 2,
    borderColor: Colors.primary[600],
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  deckStats: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  deckDate: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  deckActions: {
    flexDirection: 'row',
    gap: 8,
  },
  setActiveButton: {
    backgroundColor: Colors.accent[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setActiveButtonText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  decksList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
