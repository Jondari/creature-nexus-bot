import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { CardComponent } from '../components/CardComponent';
import { CardLoader } from '../utils/game/cardLoader';
import { isMonsterCard, isSpellCard, ExtendedCard, MonsterCard, SpellCard } from '../models/cards-extended';
import { useSettings } from '../context/SettingsContext';
import Colors from '../constants/Colors';
import { t } from '@/utils/i18n';

export default function CardTestScreen() {
  const router = useRouter();
  const { cardSize, setCardSize } = useSettings();
  
  // Load all cards using CardLoader
  const allCards = CardLoader.loadCards();
  const monsterCards = CardLoader.getMonsterCards();
  const spellCards = CardLoader.getSpellCards();
  
  // Group monster cards by rarity
  const monstersByRarity = {
    common: monsterCards.filter(card => card.rarity === 'common'),
    rare: monsterCards.filter(card => card.rarity === 'rare'),
    epic: monsterCards.filter(card => card.rarity === 'epic'),
    legendary: monsterCards.filter(card => card.rarity === 'legendary'),
    mythic: monsterCards.filter(card => card.rarity === 'mythic'),
  };

  // Group spell cards by rarity
  const spellsByRarity = {
    common: spellCards.filter(card => card.rarity === 'common'),
    rare: spellCards.filter(card => card.rarity === 'rare'),
    epic: spellCards.filter(card => card.rarity === 'epic'),
    legendary: spellCards.filter(card => card.rarity === 'legendary'),
    mythic: spellCards.filter(card => card.rarity === 'mythic'),
  };

  const renderRaritySection = (rarity: string, cards: ExtendedCard[], cardType: string) => {
    const rarityLabel = t(`rarities.${rarity}`);
    return (
      <View key={`${cardType}-${rarity}`} style={styles.raritySection}>
        <Text style={styles.rarityTitle}>
          {t('cardTest.rarityHeader', {
            rarity: rarityLabel ? rarityLabel.toUpperCase() : rarity.toUpperCase(),
            count: String(cards.length)
          })}
        </Text>
      <View style={styles.cardsGrid}>
        {cards.map((card, index) => (
          <View key={`${card.name}-${index}`} style={styles.cardWrapper}>
            <CardComponent
              card={card as any} // Type compatibility for now
              size={cardSize}
              viewMode="collection"
            />
            <Text style={styles.cardName}>{card.name}</Text>
          </View>
        ))}
      </View>
      </View>
    );
  };

  const renderCardTypeSection = (title: string, cardsByRarity: any, cardType: string) => (
    <View style={styles.cardTypeSection}>
      <Text style={styles.cardTypeTitle}>{title}</Text>
      {Object.entries(cardsByRarity).map(([rarity, cards]) => 
        (cards as ExtendedCard[]).length > 0 ? renderRaritySection(rarity, cards as ExtendedCard[], cardType) : null
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.header}>{t('profile.cardIllustrationsTest')}</Text>
          <Text style={styles.subtitle}>
            {t('cardTest.subtitle', {
              total: String(allCards.length),
              monsters: String(monsterCards.length),
              spells: String(spellCards.length)
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.sizeToggleButton}
          onPress={() => setCardSize(cardSize === 'small' ? 'normal' : 'small')}
          activeOpacity={0.7}
        >
          <Text style={styles.sizeToggleText}>
            {cardSize === 'small' ? '⊞' : '⊟'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      >
        {renderCardTypeSection(t('cardTest.monsterSection'), monstersByRarity, 'monster')}
        {renderCardTypeSection(t('cardTest.spellSection'), spellsByRarity, 'spell')}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('cardTest.footer')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingTop: 50,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.card,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  sizeToggleButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.card,
    marginLeft: 16,
  },
  sizeToggleText: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardTypeSection: {
    marginBottom: 40,
  },
  cardTypeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 3,
    borderBottomColor: Colors.accent[500],
    paddingBottom: 12,
  },
  raritySection: {
    marginBottom: 32,
  },
  rarityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent[400],
    paddingBottom: 8,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardName: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 140,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
