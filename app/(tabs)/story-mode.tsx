import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import ChapterSelection from '@/components/ChapterSelection';
import { useStoryMode } from '@/context/StoryModeContext';
import LoadingOverlay from '@/components/LoadingOverlay';
import { t } from '@/utils/i18n';
import Colors from '@/constants/Colors';
import { useSceneManager, useSceneTrigger } from '@/context/SceneManagerContext';
import { COMMON_ANCHORS } from '@/types/scenes';
import { useAnchorPolling } from '@/hooks/useAnchorPolling';

export default function StoryModeScreen() {
  const router = useRouter();
  const sceneManager = useSceneManager();
  const sceneTrigger = useSceneTrigger();
  const { chapters, isLoading } = useStoryMode();

  const handleChapterSelect = (chapter: any) => {
    // Navigate to the specific chapter map
    router.push({
      pathname: '/(tabs)/chapter-map',
      params: { chapterId: chapter.id.toString() }
    });
  };

  const handleBackPress = () => {
    router.push('/(tabs)/battle');
  };

  const anchorIds = isLoading ? [] : [COMMON_ANCHORS.CHAPTER_NODE];

  useAnchorPolling(anchorIds, () => {
    if (!isLoading) {
      sceneTrigger({ type: 'onEnterScreen', screen: 'story-mode' });
    }
  });

  if (isLoading) {
    return <LoadingOverlay message={t('story.loading')} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary[900], Colors.background.primary]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color={Colors.text.primary} />
      </TouchableOpacity>

      {/* Tutorial shortcut for Story Mode */}
      <View style={{ position: 'absolute', top: 60, right: 20, zIndex: 100 }}>
        <TouchableOpacity
          onPress={() => {
            try {
              sceneManager.startScene('tutorial_story_intro');
            } catch (error) {
              if (__DEV__) {
                console.warn('[Tutorial] Failed to start scene tutorial_story_intro', error);
              }
            }
          }}
          style={styles.tutorialButton}
        >
          <HelpCircle size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      <ChapterSelection 
        chapters={chapters}
        onChapterSelect={handleChapterSelect}
      />
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 100,
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.card,
  },
});
