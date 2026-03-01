import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Battlefield } from '@/components/board/Battlefield';
import { BATTLEFIELD_THEMES, BattlefieldTheme } from '@/types/battlefield';
import { Card } from '@/types/game';
import { CardLoader } from '@/utils/game/cardLoader';
import { t } from '@/utils/i18n';

const PREVIEW_WIDTH = 360;

function useSampleCards(): { player: Card[]; opponent: Card[] } {
  return useMemo(() => {
    const monsters = CardLoader.getMonsterCards();
    const samplePlayer = monsters.slice(0, 3);
    const sampleOpponent = monsters.slice(4, 7);

    const normalize = (cards: Card[], prefix: string) =>
      cards.map((card, index) => ({
        ...card,
        // Ensure IDs are stable even if CardLoader lacks one in certain mocks
        id: card.id || `${prefix}-${index}`,
      }));

    return {
      player: normalize(samplePlayer as Card[], 'player'),
      opponent: normalize(sampleOpponent as Card[], 'opponent'),
    };
  }, []);
}

export default function BattlefieldThemeTestScreen() {
  const router = useRouter();
  const [selectedThemeId, setSelectedThemeId] = useState<string>(BATTLEFIELD_THEMES[0]?.id ?? 'default');
  const sampleCards = useSampleCards();

  const selectedTheme: BattlefieldTheme = useMemo(() => {
    return BATTLEFIELD_THEMES.find((theme) => theme.id === selectedThemeId) ?? BATTLEFIELD_THEMES[0];
  }, [selectedThemeId]);

  const previewLabel = `${selectedTheme.name} • ${t('battle.previewFieldLabel')}`;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('profile.battlefieldThemeLab')}</Text>
          <Text style={styles.headerSubtitle}>{t('profile.battlefieldThemeLabSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.availableThemes')}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themeChips}
          >
            {BATTLEFIELD_THEMES.map((theme) => {
              const isActive = theme.id === selectedThemeId;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[styles.themeChip, isActive && styles.themeChipActive]}
                  onPress={() => setSelectedThemeId(theme.id)}
                  activeOpacity={0.8}
                >
                  <Sparkle
                    size={16}
                    color={isActive ? Colors.background.card : Colors.text.secondary}
                    style={styles.themeChipIcon}
                  />
                  <Text
                    style={[styles.themeChipText, isActive && styles.themeChipTextActive]}
                  >
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.themePreviewTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{selectedTheme.description}</Text>

          <View style={styles.previewWrapper}>
            <Battlefield
              label={previewLabel}
              position="bottom"
              cards={sampleCards.player}
              theme={selectedTheme}
              cardSize="small"
              emptyLabel={t('battle.noCreaturesPreview')}
              aiHighlight={() => null}
            />
          </View>

          <View style={styles.previewWrapper}>
            <Battlefield
              label={t('battle.previewOpponentField')}
              position="top"
              cards={sampleCards.opponent}
              theme={selectedTheme}
              cardSize="small"
              emptyLabel={t('battle.noCreaturesPreview')}
              aiHighlight={() => null}
              disabled
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.themeConfigTitle')}</Text>
          <View style={styles.detailsCard}>
            <ThemeDetail label={t('profile.themeId')} value={selectedTheme.id} />
            <ThemeDetail
              label={t('profile.fieldBorder')}
              value={`${selectedTheme.fieldBorderColor ?? 'auto'} · ${selectedTheme.fieldBorderWidth ?? 1}px`}
            />
            <ThemeDetail
              label={t('profile.fieldBackground')}
              value={selectedTheme.fieldBackgroundColor ?? t('profile.autoValue')}
            />
            <ThemeDetail
              label={t('profile.cardSpacing')}
              value={`${selectedTheme.cardSpacing ?? 12}`}
            />
            <ThemeDetail
              label={t('profile.particleEffects')}
              value={selectedTheme.particleEffects?.length
                ? selectedTheme.particleEffects.map((effect) => `${effect.type} ×${effect.density}`).join(', ')
                : t('profile.noneValue')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ThemeDetail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.card,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  themeChips: {
    gap: 12,
    paddingRight: 12,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.neutral[700],
  },
  themeChipActive: {
    backgroundColor: Colors.accent[600],
    borderColor: Colors.accent[600],
  },
  themeChipIcon: {
    marginRight: 8,
  },
  themeChipText: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  themeChipTextActive: {
    color: Colors.background.card,
  },
  previewWrapper: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: PREVIEW_WIDTH,
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  detailValue: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
