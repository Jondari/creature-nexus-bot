import React, { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, CheckCircle } from 'lucide-react-native';
import { StoryChapter } from '@/data/storyMode';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';
import { useAnchorRegister } from '@/context/AnchorsContext';
import { COMMON_ANCHORS } from '@/types/scenes';

interface ChapterSelectionProps {
  chapters: StoryChapter[];
  onChapterSelect: (chapter: StoryChapter) => void;
}

const getElementIcon = (element: string): string => {
  switch (element) {
    case 'fire': return '🔥';
    case 'water': return '💧';
    case 'earth': return '🌍';
    case 'air': return '💨';
    case 'all': return '✨';
    default: return '⚡';
  }
};

export default function ChapterSelection({ chapters, onChapterSelect }: ChapterSelectionProps) {
  const firstHighlightChapterId = useMemo(() => {
    if (!chapters || chapters.length === 0) return undefined;
    const unlocked = chapters.find(ch => ch.isUnlocked);
    return (unlocked ?? chapters[0])?.id;
  }, [chapters]);

  const chapterAnchorRef = useRef<TouchableOpacity | null>(null);
  useAnchorRegister(COMMON_ANCHORS.CHAPTER_NODE, chapterAnchorRef, [firstHighlightChapterId]);

  const renderChapterCard = (chapter: StoryChapter) => {
    const isLocked = !chapter.isUnlocked;
    const completedBattles = chapter.battles.filter(b => b.isCompleted).length;
    const totalBattles = chapter.battles.length;
    const progressPercentage = totalBattles > 0 ? (completedBattles / totalBattles) * 100 : 0;

    return (
      <TouchableOpacity
        key={chapter.id}
        style={[styles.chapterCard, isLocked && styles.lockedCard]}
        onPress={() => !isLocked && onChapterSelect(chapter)}
        disabled={isLocked}
        activeOpacity={0.8}
        ref={chapter.id === firstHighlightChapterId ? chapterAnchorRef : undefined}
      >
        <LinearGradient
          colors={isLocked 
            ? [Colors.neutral[700], Colors.neutral[800]] 
            : [chapter.colorTheme.primary, chapter.colorTheme.background]
          }
          style={styles.chapterGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.chapterHeader}>
            <View style={styles.chapterTitleRow}>
              <Text style={styles.chapterNumber}>{t('story.chapter.label', { id: String(chapter.id) })}</Text>
              <View style={styles.chapterStatus}>
                {isLocked ? (
                  <Lock size={16} color={Colors.neutral[400]} />
                ) : chapter.isCompleted ? (
                  <CheckCircle size={16} color="#FFD700" />
                ) : null}
              </View>
            </View>
            
            <View style={styles.elementRow}>
              <Text style={styles.elementIcon}>{getElementIcon(chapter.element)}</Text>
              <Text style={[
                styles.chapterTitle,
                { color: isLocked ? Colors.neutral[400] : Colors.text.primary }
              ]}>
                {t(chapter.name)}
              </Text>
            </View>
          </View>

          <Text style={[
            styles.chapterDescription,
            { color: isLocked ? Colors.neutral[500] : Colors.text.secondary }
          ]}>
            {t(chapter.description)}
          </Text>

          {!isLocked && (
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  {t('story.chapter.progressFull', {
                    completed: String(completedBattles),
                    total: String(totalBattles)
                  })}
                </Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(progressPercentage)}%
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: chapter.colorTheme.accent 
                    }
                  ]} 
                />
              </View>
            </View>
          )}

          {isLocked && (
            <View style={styles.lockedOverlay}>
              <Text style={styles.lockedText}>{t('story.chapter.locked')}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('story.menu.title')}</Text>
        <Text style={styles.subtitle}>{t('story.menu.subtitle')}</Text>
      </View>

      <View style={styles.chaptersContainer}>
        {chapters.map(renderChapterCard)}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('story.menu.footer')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  chaptersContainer: {
    gap: 16,
  },
  chapterCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  lockedCard: {
    opacity: 0.6,
  },
  chapterGradient: {
    padding: 20,
    minHeight: 140,
  },
  chapterHeader: {
    marginBottom: 12,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chapterNumber: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  chapterStatus: {
    marginLeft: 8,
  },
  elementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  elementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  chapterTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  chapterDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    marginTop: 'auto',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
  progressPercentage: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background.primary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  lockedOverlay: {
    alignItems: 'center',
    marginTop: 12,
  },
  lockedText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[400],
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 32,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
