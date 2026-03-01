import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sword, BookOpen, GraduationCap } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';
import {isDemoMode} from "@/config/localMode";

export default function BattleScreen() {
  const router = useRouter();

  const handleQuickBattle = () => {
    router.push('/(tabs)/quick-battle');
  };

  const handleStoryMode = () => {
    router.push('/(tabs)/story-mode');
  };

  const handleBattleTutorial = () => {
    router.push('/(tabs)/battle-tutorial');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary[900], Colors.background.primary]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('battle.arena.title')}</Text>
          <Text style={styles.subtitle}>{t('battle.arena.subtitle')}</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
              style={styles.optionCard}
              onPress={handleBattleTutorial}
              activeOpacity={0.8}
          >
            <LinearGradient
                colors={[Colors.neutral[700], Colors.neutral[500]]}
                style={styles.optionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
              <GraduationCap size={48} color={Colors.text.primary} />
              <Text style={styles.optionTitle}>{t('battle.arena.tutorialTitle')}</Text>
              <Text style={styles.optionDescription}>
                {t('battle.arena.tutorialDescription')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleQuickBattle}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.accent[700], Colors.accent[500]]}
              style={styles.optionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sword size={48} color={Colors.text.primary} />
              <Text style={styles.optionTitle}>{t('battle.arena.quickTitle')}</Text>
              <Text style={styles.optionDescription}>
                {t('battle.arena.quickDescription')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!isDemoMode && (
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleStoryMode}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary[700], Colors.primary[500]]}
                style={styles.optionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <BookOpen size={48} color={Colors.text.primary} />
                <Text style={styles.optionTitle}>{t('battle.arena.storyTitle')}</Text>
                <Text style={styles.optionDescription}>
                  {t('battle.arena.storyDescription')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 24,
  },
  optionCard: {
    height: 180,
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
  optionGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
    textAlign: 'center',
    opacity: 0.9,
  },
});
