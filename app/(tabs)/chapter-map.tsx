import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import StoryMap from '@/components/StoryMap';
import { useStoryMode } from '@/context/StoryModeContext';
import { StoryChapter, StoryBattle } from '@/data/storyMode';
import { showAlert, showErrorAlert } from '@/utils/alerts';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';
import { useSceneManager, useSceneTrigger } from '@/context/SceneManagerContext';
import { COMMON_ANCHORS } from '@/types/scenes';
import { useAnchorPolling } from '@/hooks/useAnchorPolling';

export default function ChapterMapScreen() {
  const router = useRouter();
  const sceneManager = useSceneManager();
  const sceneTrigger = useSceneTrigger();
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { chapters } = useStoryMode();
  const [chapter, setChapter] = useState<StoryChapter | null>(null);

  useEffect(() => {
    if (chapterId && chapters.length > 0) {
      const foundChapter = chapters.find(c => c.id === parseInt(chapterId));
      if (foundChapter) {
        setChapter(foundChapter);
      } else {
        router.replace('/(tabs)/story-mode');
      }
    }
  }, [chapterId, chapters]);

  const handleBattleSelect = (battle: StoryBattle) => {
    if (!battle.isAccessible) {
      showErrorAlert(t('story.battleLockedTitle'), t('story.battleLockedDesc'));
      return;
    }

    if (battle.isCompleted) {
      showAlert(
        t('story.chapterMap.replayTitle'),
        t('story.chapterMap.replayMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('story.chapterMap.replay'), onPress: () => setTimeout(() => startBattle(battle), 0) }
        ],
        'warning'
      );
      return;
    }

    startBattle(battle);
  };

  const startBattle = (battle: StoryBattle) => {
    if (!chapter) return;

    const difficulty = battle.isBoss
      ? t('story.chapterMap.difficulty.boss')
      : t('story.chapterMap.difficulty.normal');
    const elementName = (() => {
      const elementKey = `elements.${chapter.element}`;
      const translated = t(elementKey);
      return translated !== elementKey ? translated : chapter.element;
    })();
    const summary = [
      t(battle.description),
      '',
      `${t('story.chapterMap.difficultyLabel')} ${difficulty}`,
      `${t('story.chapterMap.elementLabel')} ${elementName}`
    ].join('\n');

    showAlert(
      t(battle.name),
      summary,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('story.chapterMap.start'),
          onPress: () => {
            router.push({
              pathname: '/(tabs)/story-battle',
              params: {
                chapterId: chapter.id.toString(),
                battleId: battle.id,
                session: Date.now().toString(),
              }
            });
          }
        }
      ],
      'warning'
    );
  };

  const handleBackPress = () => {
    router.push('/(tabs)/story-mode');
  };

  useAnchorPolling([COMMON_ANCHORS.BATTLE_NODE], () => {
    if (chapter) {
      sceneTrigger({ type: 'onEnterScreen', screen: 'chapter-map' });
    }
  });

  if (!chapter) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary[900], Colors.background.primary]}
          style={styles.background}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('story.chapterMap.loading')}</Text>
        </View>
      </View>
    );
  }

  const completedCount = chapter.battles.filter(b => b.isCompleted).length;
  const totalBattles = chapter.battles.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[chapter.colorTheme.background, Colors.background.primary]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.chapterNumber}>{t('story.chapter.label', { id: String(chapter.id) })}</Text>
          <Text style={styles.chapterTitle}>{t(chapter.name)}</Text>
        </View>
      </View>

      {/* Chapter Map */}
      <View style={styles.mapContainer}>
        {/* Tutorial shortcut for Chapter Map */}
        {chapter?.id === 1 && (
          <View style={{ position: 'absolute', top: -60, right: 20, zIndex: 1000 }}>
            <TouchableOpacity
              onPress={() => {
                try {
                  sceneManager.startScene('tutorial_chapter_map');
                } catch (error) {
                  if (__DEV__) {
                    console.warn('[Tutorial] Failed to start scene tutorial_chapter_map', error);
                  }
                }
              }}
              style={styles.tutorialButton}
            >
              <HelpCircle size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        )}
        <StoryMap
          chapter={chapter}
          onBattleSelect={handleBattleSelect}
        />
      </View>

      {/* Chapter Info */}
      <View style={styles.infoContainer}>
        <LinearGradient
          colors={[chapter.colorTheme.primary + '20', 'transparent']}
          style={styles.infoGradient}
        >
          <Text style={styles.chapterDescription}>{t(chapter.description)}</Text>
          
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {t('story.chapterMap.progress', {
                completed: String(completedCount),
                total: String(totalBattles)
              })}
            </Text>
            {chapter.isCompleted && (
              <Text style={styles.completedText}>{t('story.chapterMap.completed')}</Text>
            )}
          </View>
        </LinearGradient>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    //paddingBottom: 40,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.card,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  chapterNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  chapterTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  infoContainer: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoGradient: {
    padding: 20,
    backgroundColor: Colors.background.card,
  },
  chapterDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
  completedText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
});
