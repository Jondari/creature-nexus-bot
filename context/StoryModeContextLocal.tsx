/**
 * StoryModeContextLocal - Local story mode context for demo mode
 *
 * Provides the same interface as StoryModeContext but without Firebase.
 * All progress is stored locally via AsyncStorage.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORY_CHAPTERS, StoryChapter, StoryBattle } from '@/data/storyMode';
import StoryDeckGenerator from '@/utils/storyDeckGenerator';
import { DEMO_STORAGE_KEYS } from '@/utils/localStorageUtils';
import { useAuth } from './AuthContextLocal';

const SCHEMA_VERSION = 1;

interface StoryProgressLight {
  schemaVersion: number;
  currentChapter: number;
  unlockedChapters: number[];
  completedBattles: Record<number, string[]>;
  lastUpdated: Date;
}

// Helper functions (same as original)
function deepCloneChapters(src: StoryChapter[]): StoryChapter[] {
  return src.map((c) => ({ ...c, battles: c.battles.map((b) => ({ ...b })) }));
}

function buildChaptersFromLight(light: StoryProgressLight, canon: StoryChapter[]): StoryChapter[] {
  const chapters = deepCloneChapters(canon);
  const unlocked = new Set(light.unlockedChapters);

  for (const ch of chapters) {
    ch.isUnlocked = unlocked.has(ch.id) || ch.id === 1;

    const byId = new Map<string, StoryBattle>();
    for (const b of ch.battles) {
      byId.set(String(b.id), b);
    }

    const doneIds = new Set<string>((light.completedBattles[ch.id] || []).map((id) => String(id)));

    for (const b of ch.battles) {
      b.isCompleted = doneIds.has(String(b.id));
      b.isAccessible = false;
    }

    if (ch.isUnlocked) {
      const first = ch.battles[0];
      if (first) {
        first.isAccessible = true;
      }

      for (const b of ch.battles) {
        if (b.isCompleted) {
          b.isAccessible = true;
        }
      }

      const queue: StoryBattle[] = ch.battles.filter((b) => b.isCompleted);
      const visited = new Set<string>();

      while (queue.length) {
        const cur = queue.shift()!;
        const curKey = String(cur.id);
        if (visited.has(curKey)) continue;
        visited.add(curKey);

        for (const connId of cur.connections) {
          const nb = byId.get(String(connId));
          if (!nb) continue;

          if (!nb.isCompleted) {
            nb.isAccessible = true;
          } else {
            queue.push(nb);
          }
        }
      }
    }
  }

  return chapters;
}

function reconcileChapters(src: StoryChapter[]): StoryChapter[] {
  const chapters = deepCloneChapters(src);
  if (!chapters.length) return chapters;
  chapters[0].isUnlocked = true;
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const allDone = ch.battles.every((b) => b.isCompleted);
    const bossBeaten = ch.battles.some((b) => b.isBoss && b.isCompleted);
    ch.isCompleted = allDone;
    if (bossBeaten || allDone) {
      const nxt = i + 1;
      if (nxt < chapters.length) chapters[nxt].isUnlocked = true;
    }
  }
  return chapters;
}

export interface StoryModeContextType {
  chapters: StoryChapter[];
  currentChapter: number;
  isLoading: boolean;
  completeBattle: (chapterId: number, battleId: string) => Promise<void>;
  unlockChapter: (chapterId: number) => Promise<void>;
  resetProgress: () => Promise<void>;
  unlockAllChapters: () => Promise<void>;
  getChapterProgress: (chapterId: number) => { completed: number; total: number; percentage: number };
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}

const StoryModeContext = createContext<StoryModeContextType | undefined>(undefined);

export function StoryModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<StoryChapter[]>([...STORY_CHAPTERS]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Reload progress when user changes (e.g. sign-out → sign-in)
  useEffect(() => {
    loadProgress();
  }, [user?.uid]);

  const saveProgressLight = async (light: StoryProgressLight) => {
    await AsyncStorage.setItem(DEMO_STORAGE_KEYS.STORY_PROGRESS, JSON.stringify(light));
  };

  const saveProgress = async () => {
    try {
      const unlockedChapters = chapters.filter((ch) => ch.isUnlocked).map((ch) => ch.id);
      const completedBattles: Record<number, string[]> = {};
      chapters.forEach((ch) => {
        const completed = ch.battles.filter((b) => b.isCompleted).map((b) => b.id);
        if (completed.length) completedBattles[ch.id] = completed;
      });

      const light: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter,
        unlockedChapters,
        completedBattles,
        lastUpdated: new Date(),
      };

      await saveProgressLight(light);
    } catch (e) {
      if (__DEV__) console.error('saveProgress (demo) failed', e);
    }
  };

  const loadProgress = async () => {
    try {
      setIsLoading(true);

      const stored = await AsyncStorage.getItem(DEMO_STORAGE_KEYS.STORY_PROGRESS);

      if (stored) {
        const light: StoryProgressLight = JSON.parse(stored);
        light.lastUpdated = new Date(light.lastUpdated);

        const chaptersBuilt = buildChaptersFromLight(light, STORY_CHAPTERS);
        const reconciled = reconcileChapters(chaptersBuilt);
        setChapters(reconciled);
        setCurrentChapter(light.currentChapter);
        return;
      }

      // Bootstrap with defaults
      const defaultLight: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter: 1,
        unlockedChapters: [1],
        completedBattles: {},
        lastUpdated: new Date(),
      };

      await saveProgressLight(defaultLight);

      const chaptersBuilt = buildChaptersFromLight(defaultLight, STORY_CHAPTERS);
      const reconciled = reconcileChapters(chaptersBuilt);
      setChapters(reconciled);
      setCurrentChapter(1);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading story progress (demo):', error);
      }
      const defaultChapters = [...STORY_CHAPTERS];
      defaultChapters[0].isUnlocked = true;
      setChapters(defaultChapters);
      setCurrentChapter(1);
    } finally {
      setIsLoading(false);
    }
  };

  const completeBattle = async (chapterId: number, battleId: string) => {
    try {
      const updatedChapters = chapters.map((ch) => ({
        ...ch,
        battles: ch.battles.map((b) => ({ ...b })),
      }));

      const chapterIndex = updatedChapters.findIndex((c) => c.id === chapterId);
      if (chapterIndex === -1) return;
      const chapter = updatedChapters[chapterIndex];
      const battle = chapter.battles.find((b) => b.id === battleId);
      if (!battle || battle.isCompleted) return;

      battle.isCompleted = true;

      for (const connId of battle.connections) {
        const neighbor = chapter.battles.find((b) => b.id === connId);
        if (neighbor) neighbor.isAccessible = true;
      }

      let nextCurrent = currentChapter;

      const chapterFullyCompleted = chapter.battles.every((b) => b.isCompleted);
      const bossDefeated = battle.isBoss || chapter.battles.some((b) => b.isBoss && b.isCompleted);

      if (bossDefeated || chapterFullyCompleted) {
        chapter.isCompleted = true;
        const nextIdx = chapterIndex + 1;
        if (nextIdx < updatedChapters.length) {
          updatedChapters[nextIdx].isUnlocked = true;
          nextCurrent = updatedChapters[nextIdx].id;
        }
      }

      const reconciled = reconcileChapters(updatedChapters);

      setChapters(reconciled);
      setCurrentChapter(nextCurrent);

      const unlockedChapters = reconciled.filter((c) => c.isUnlocked).map((c) => c.id);
      const completedBattles: Record<number, string[]> = Object.fromEntries(
        reconciled.map((c) => [c.id, c.battles.filter((b) => b.isCompleted).map((b) => b.id)])
      );

      const lightProgress: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter: nextCurrent,
        unlockedChapters,
        completedBattles,
        lastUpdated: new Date(),
      };
      await saveProgressLight(lightProgress);
    } catch (error) {
      if (__DEV__) console.error('completeBattle (demo) failed:', error);
    }
  };

  const unlockChapter = async (chapterId: number) => {
    try {
      const updatedChapters = chapters.map((ch) => ({
        ...ch,
        battles: ch.battles.map((b) => ({ ...b })),
      }));

      const chapter = updatedChapters.find((c) => c.id === chapterId);
      if (chapter && !chapter.isUnlocked) {
        chapter.isUnlocked = true;

        const first = chapter.battles[0];
        if (first && !first.isCompleted) {
          first.isAccessible = true;
        }

        setChapters(updatedChapters);
        await saveProgress();
      }
    } catch (error) {
      if (__DEV__) console.error('Error unlocking chapter (demo):', error);
    }
  };

  const resetProgress = async () => {
    try {
      await AsyncStorage.removeItem(DEMO_STORAGE_KEYS.STORY_PROGRESS);

      const defaultLight: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter: 1,
        unlockedChapters: [1],
        completedBattles: {},
        lastUpdated: new Date(),
      };

      await saveProgressLight(defaultLight);

      const chaptersBuilt = buildChaptersFromLight(defaultLight, STORY_CHAPTERS);
      const reconciled = reconcileChapters(chaptersBuilt);
      setChapters(reconciled);
      setCurrentChapter(1);
    } catch (error) {
      if (__DEV__) {
        console.error('Error resetting progress (demo):', error);
      }
    }
  };

  const unlockAllChapters = async () => {
    try {
      const targetCurrent = 1;
      const allChapterIds = STORY_CHAPTERS.map((ch) => ch.id);

      const lightProgress: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter: targetCurrent,
        unlockedChapters: allChapterIds,
        completedBattles: {},
        lastUpdated: new Date(),
      };
      await saveProgressLight(lightProgress);

      const built = buildChaptersFromLight(lightProgress, STORY_CHAPTERS);
      const reconciled = reconcileChapters(built);
      setChapters(reconciled);
      setCurrentChapter(targetCurrent);
    } catch (error) {
      if (__DEV__) console.error('unlockAllChapters (demo) failed:', error);
    }
  };

  const getChapterProgress = (chapterId: number) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = chapter.battles.filter((b) => b.isCompleted).length;
    const total = chapter.battles.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  return (
    <StoryModeContext.Provider
      value={{
        chapters,
        currentChapter,
        isLoading,
        completeBattle,
        unlockChapter,
        resetProgress,
        unlockAllChapters,
        getChapterProgress,
        saveProgress,
        loadProgress,
      }}
    >
      {children}
    </StoryModeContext.Provider>
  );
}

export function useStoryMode(): StoryModeContextType {
  const context = useContext(StoryModeContext);
  if (context === undefined) {
    throw new Error('useStoryMode must be used within a StoryModeProvider');
  }
  return context;
}

export function getAIDeckForBattle(chapterId: number, battleIndex: number, isBoss: boolean) {
  if (isBoss) return StoryDeckGenerator.generateBossDeck(chapterId);
  const cfg = StoryDeckGenerator.getChapterDeckConfig(chapterId, battleIndex);
  const gen = new StoryDeckGenerator(cfg.seed);
  return gen.generateDeck(cfg);
}
