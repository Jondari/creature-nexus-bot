import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList } from 'react-native';
import { Card, CardRarity } from '../models/Card';
import { ExtendedCard } from '@/models/cards-extended';
import { CardComponent } from './CardComponent';
import { Sidebar } from './Sidebar';
import { RulesContent } from './RulesContent';
import { groupByModel, CardGrouped } from '../utils/cardUtils';
import { showErrorAlert } from '@/utils/alerts';
import { t } from '@/utils/i18n';
import Colors from '../constants/Colors';
import { useAnchorRegister } from '@/context/AnchorsContext';
import { COMMON_ANCHORS } from '@/types/scenes';

interface DeckBuilderProps {
  availableCards: Array<Card | ExtendedCard>;
  onSaveDeck: (deck: Array<Card | ExtendedCard>, deckName: string) => void;
  onClose: () => void;
  initialDeck?: Array<Card | ExtendedCard>;
  deckName?: string;
}

const DECK_SIZE_MIN = 20;
const DECK_SIZE_MAX = 60;
const MAX_COPIES_PER_CARD = 3;

export function DeckBuilder({ 
  availableCards, 
  onSaveDeck, 
  onClose,
  initialDeck = [],
  deckName: initialDeckName = ''
}: DeckBuilderProps) {
  const [currentDeck, setCurrentDeck] = useState<Array<Card | ExtendedCard>>(initialDeck as Array<Card | ExtendedCard>);
  const [deckName, setDeckName] = useState(initialDeckName);
  const [filter, setFilter] = useState<CardRarity | 'all'>('all');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);
  const gridAnchorRef = useRef<View | null>(null);
  const deckInfoRef = useRef<View | null>(null);
  const filterSectionRef = useRef<View | null>(null);
  const currentDeckButtonRef = useRef<TouchableOpacity | null>(null);
  const saveButtonRef = useRef<TouchableOpacity | null>(null);

  // Group available cards and current deck by model (memoized)
  const groupedAvailable: CardGrouped[] = useMemo(() => groupByModel(availableCards), [availableCards]);
  const groupedDeck: CardGrouped[] = useMemo(() => groupByModel(currentDeck), [currentDeck]);

  // Filter available grouped items by rarity (memoized)
  const filteredGroups: CardGrouped[] = useMemo(() => {
    if (filter === 'all') return groupedAvailable;
    return groupedAvailable.filter((g) => g.rarity === filter);
  }, [groupedAvailable, filter]);

  useAnchorRegister(COMMON_ANCHORS.DECK_EDITOR_GRID, gridAnchorRef, [filter, filteredGroups.length, currentDeck.length]);
  useAnchorRegister(COMMON_ANCHORS.DECK_EDITOR_INFO, deckInfoRef, [currentDeck.length]);
  useAnchorRegister(COMMON_ANCHORS.DECK_EDITOR_FILTERS, filterSectionRef, [filter]);
  useAnchorRegister(COMMON_ANCHORS.DECK_EDITOR_CURRENT_DECK_BUTTON, currentDeckButtonRef, [sidebarVisible]);
  useAnchorRegister(COMMON_ANCHORS.DECK_EDITOR_SAVE_BUTTON, saveButtonRef, [currentDeck.length]);


  // Render item for FlatList
  const renderCard = useCallback(({ item }: { item: CardGrouped }) => {
    const name = item.name;
    const inDeck = getCardCountInDeck(name);
    const available = getAvailableCount(name);
    const canAdd = canAddCard(name);

    const itemKey = `${item.modelId}-${inDeck}-${available}-${currentDeck.length}`;

    return (
      <View key={itemKey} style={styles.cardContainer}>
        <View style={styles.cardWithIndicator}>
          <CardComponent
            card={item.sample}
            onPress={() => canAdd && addCardToDeck(item.sample)}
            disabled={!canAdd}
            size="small"
          />
          {inDeck > 0 && (
            <View style={styles.deckIndicator}>
              <Text style={styles.deckIndicatorText}>{inDeck}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardStats}>
            {t('decks.inDeckCount', { count: String(inDeck), max: String(MAX_COPIES_PER_CARD) })}
          </Text>
          <Text style={styles.cardStats}>
            {t('decks.availableCount', { count: String(available) })}
          </Text>
        </View>
      </View>
    );
  }, [currentDeck.length]);

  const addCardToDeck = (card: Card | ExtendedCard) => {
    const cardsOfSameName = currentDeck.filter(c => c.name === card.name);
    
    if (cardsOfSameName.length >= MAX_COPIES_PER_CARD) {
      showErrorAlert(t('common.error'), t('decks.limitCopies', { max: String(MAX_COPIES_PER_CARD), name: card.name }));
      return;
    }

    if (currentDeck.length >= DECK_SIZE_MAX) {
      showErrorAlert(t('common.error'), t('decks.deckFull', { max: String(DECK_SIZE_MAX) }));
      return;
    }

    // Find an available card of this name from collection
    const availableCard = availableCards.find(c => 
      c.name === card.name && 
      !currentDeck.some(deckCard => deckCard.id === c.id)
    ) as Card | ExtendedCard | undefined;

    if (availableCard) {
      setCurrentDeck([...currentDeck, availableCard]);
    }
  };

  const removeCardFromDeck = (cardId: string) => {
    setCurrentDeck(currentDeck.filter(card => card.id !== cardId));
  };

  const getCardCountInDeck = (cardName: string): number => {
    return currentDeck.filter(card => card.name === cardName).length;
  };

  const getAvailableCount = (cardName: string): number => {
    const totalOwned = groupedAvailable.find(g => g.name === cardName)?.count || 0;
    const inDeck = getCardCountInDeck(cardName);
    return totalOwned - inDeck;
  };

  const canAddCard = (cardName: string): boolean => {
    const inDeck = getCardCountInDeck(cardName);
    const available = getAvailableCount(cardName);
    return inDeck < MAX_COPIES_PER_CARD && available > 0 && currentDeck.length < DECK_SIZE_MAX;
  };

  const handleSave = () => {
    if (currentDeck.length < DECK_SIZE_MIN) {
      showErrorAlert(
        t('decks.tooSmallTitle'),
        t('decks.tooSmallBody', { min: String(DECK_SIZE_MIN) })
      );
      return;
    }

    if (!deckName.trim()) {
      showErrorAlert(t('common.error'), t('decks.nameRequired'));
      return;
    }

    onSaveDeck(currentDeck, deckName.trim());
  };

  const filterOptions: Array<CardRarity | 'all'> = ['all', 'common', 'rare', 'epic', 'legendary', 'mythic'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('decks.builderTitle')}</Text>
        <View style={styles.headerActions}>
          {/* Rules button */}
          <TouchableOpacity
            onPress={() => setSidebarVisible(true)}
            style={styles.deckButton}
            ref={currentDeckButtonRef as any}
          >
            <Text style={styles.deckButtonText}>{t('decks.currentDeckButton', { count: String(currentDeck.length) })}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} ref={saveButtonRef as any}>
            <Text style={styles.saveText}>{t('decks.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Deck Info */}
      <View style={styles.deckInfo} ref={deckInfoRef as any}>
        <Text style={styles.deckSize}>{t('decks.deckSize', { count: String(currentDeck.length), max: String(DECK_SIZE_MAX) })}</Text>
        <Text style={styles.deckStatus}>
          {currentDeck.length < DECK_SIZE_MIN 
            ? t('decks.needMore', { count: String(DECK_SIZE_MIN - currentDeck.length) })
            : t('decks.deckValid')}
        </Text>
        <TouchableOpacity
            onPress={() => setRulesVisible(true)}
            style={[
                styles.deckButton,
              {
                backgroundColor: Colors.background.primary,
                padding: 8,
                marginTop: 10,
                alignSelf: 'flex-start'
              }]}
            accessibilityLabel={t('decks.rulesA11y')}
        >
          <Text style={[styles.deckButtonText, { color: Colors.text.primary }]}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Available Cards - Using collection-style layout */}
        <View style={styles.collectionSection}>
          <Text style={styles.sectionTitle}>{t('collection.title')}</Text>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection} ref={filterSectionRef as any}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.filterButton, filter === option && styles.filterButtonActive]}
                onPress={() => setFilter(option)}
              >
                <Text style={[styles.filterText, filter === option && styles.filterTextActive]}>
                  {option === 'all' ? t('collection.filters.all') : t(`rarities.${option}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Cards Grid - Using collection-style layout */}
        <View style={styles.cardsSection} ref={gridAnchorRef as any}>
          <FlatList
            key={`deckbuilder-flatlist-${filter}`}
            data={filteredGroups}
            renderItem={renderCard}
            keyExtractor={(g) => g.modelId}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={20}
            windowSize={20}
            initialNumToRender={10}
          />
        </View>
      </View>

      {/* Deck Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        title={t('decks.activeDeck')}
        width={400}
      >
        <View style={styles.sidebarContent}>
          {/* Deck Name Input */}
          <View style={styles.deckNameSection}>
            <Text style={styles.deckNameLabel}>{t('decks.deckName')}</Text>
            <TextInput
              style={styles.deckNameInput}
              value={deckName}
              onChangeText={setDeckName}
              placeholder={t('decks.deckNamePlaceholder')}
              placeholderTextColor={Colors.text.secondary}
            />
          </View>

          {/* Deck Stats */}
          <View style={styles.deckStats}>
            <Text style={styles.deckStatsText}>{t('decks.totalCards', { count: String(currentDeck.length), max: String(DECK_SIZE_MAX) })}</Text>
            <Text style={[
              styles.deckStatsText,
              currentDeck.length >= DECK_SIZE_MIN ? styles.validDeck : styles.invalidDeck
            ]}>
              {currentDeck.length < DECK_SIZE_MIN 
                ? t('decks.needMore', { count: String(DECK_SIZE_MIN - currentDeck.length) }) 
                : t('decks.deckValid')}
            </Text>
          </View>

          {/* Deck Cards */}
          <ScrollView style={styles.sidebarDeckList}>
            {groupedDeck.length === 0 ? (
              <Text style={styles.emptyDeckText}>{t('decks.emptyDeck')}</Text>
            ) : (
              groupedDeck.map((g) => (
                <View key={g.modelId} style={styles.sidebarDeckCard}>
                  <CardComponent
                    card={g.sample}
                    onPress={() => removeCardFromDeck(g.sample.id)}
                    size="small"
                  />
                  <View style={styles.sidebarCardInfo}>
                    <Text style={styles.sidebarCardName}>{g.name}</Text>
                    <Text style={styles.sidebarCardCount}>{t('decks.quantity', { count: String(g.count) })}</Text>
                    <TouchableOpacity
                      style={styles.removeCardButton}
                      onPress={() => removeCardFromDeck(g.sample.id)}
                    >
                      <Text style={styles.removeCardText}>{t('decks.remove')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Sidebar>

      {/* Rules Sidebar */}
      <Sidebar
        visible={rulesVisible}
        onClose={() => setRulesVisible(false)}
        title={t('decks.rulesTitle')}
        width={420}
      >
        <RulesContent context="deck" />
      </Sidebar>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[700],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: Colors.text.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  deckButton: {
    backgroundColor: Colors.accent[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deckButtonText: {
    color: Colors.text.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  deckInfo: {
    padding: 16,
    backgroundColor: Colors.background.card,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  deckSize: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  deckStatus: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  collectionSection: {
    paddingHorizontal: 16,
  },
  // Collection-style layout
  filterSection: {
    backgroundColor: Colors.background.primary,
    zIndex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 56,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.background.card,
    height: 32,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[600],
  },
  filterText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  filterTextActive: {
    color: Colors.text.primary,
  },
  cardsSection: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  cardContainer: {
    marginBottom: 12,
  },
  cardWithIndicator: {
    position: 'relative',
  },
  deckIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary[600],
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  deckIndicatorText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  cardStats: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  // Sidebar styles
  sidebarContent: {
    flex: 1,
    padding: 16,
  },
  deckNameSection: {
    marginBottom: 16,
  },
  deckNameLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  deckNameInput: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    borderRadius: 8,
    padding: 12,
    color: Colors.text.primary,
    fontSize: 14,
  },
  deckStats: {
    backgroundColor: Colors.background.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  deckStatsText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  validDeck: {
    color: Colors.success,
  },
  invalidDeck: {
    color: Colors.error,
  },
  sidebarDeckList: {
    flex: 1,
  },
  emptyDeckText: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: 14,
    marginTop: 32,
    fontStyle: 'italic',
  },
  sidebarDeckCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  sidebarCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sidebarCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sidebarCardCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  removeCardButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  removeCardText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
