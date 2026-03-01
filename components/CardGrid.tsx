import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, FlatList } from 'react-native';
import { CardComponent } from './CardComponent';
import { CardRarity, RARITY_COLORS } from '../models/Card';
import { CardGrouped } from '../utils/cardUtils';
import { CardSize } from '../context/SettingsContext';
import Colors from '../constants/Colors';
import { t } from '@/utils/i18n';

interface CardGridProps {
  // Pre-grouped items: one entry per model with a count
  items: CardGrouped[];
  filter: CardRarity | 'all';
  onFilterChange: (filter: CardRarity | 'all') => void;
  cardSize?: CardSize;
}

export default function CardGrid({ items, filter, onFilterChange, cardSize = 'small' }: CardGridProps) {
  // Filter grouped items by rarity, keeps the list small and fast for Android
  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((g) => g.rarity === filter);
  }, [items, filter]);
  
  const filterOptions: Array<CardRarity | 'all'> = ['all', 'common', 'rare', 'epic', 'legendary', 'mythic'];
  

  // Render item for FlatList
  // Render a single grouped tile with a quantity badge (x{count})
  const renderCard = useCallback(({ item }: { item: CardGrouped }) => (
    <CardComponent
      key={item.modelId}
      card={item.sample}
      viewMode="collection"
      count={item.count}
      size={cardSize}
    />
  ), [cardSize]);
  
  const renderFilterButtons = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterContainer}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterButton,
              filter === option && styles.filterButtonActive,
              filter === option && option !== 'all' && { backgroundColor: RARITY_COLORS[option as CardRarity] }
            ]}
            onPress={() => onFilterChange(option)}
          >
            <Text 
              style={[
                styles.filterButtonText,
                filter === option && styles.filterButtonTextActive
              ]}
            >
              {option === 'all' ? t('collection.filters.all') : t(`rarities.${option}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        {renderFilterButtons()}
      </View>
      
      <View style={styles.contentSection}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('collection.emptyTitle')}</Text>
            <Text style={styles.emptySubtext}>{t('collection.emptySubtitle')}</Text>
          </View>
        ) : (
          <FlatList
            key={`collection-flatlist-${filter}`}
            data={filteredItems}
            renderItem={renderCard}
            keyExtractor={(g) => g.modelId}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={20}
            windowSize={20}
            initialNumToRender={10}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: Colors.background.primary,
    zIndex: 1, // Ensure filters stay on top
  },
  contentSection: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 56, // Fixed height to prevent size variation
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.background.card,
    height: 32, // Fixed height for consistent button size
    justifyContent: 'center', // Center text vertically
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  filterButtonText: {
    color: Colors.text.secondary,
    fontWeight: '500',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: Colors.text.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 80,
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
  }
});
