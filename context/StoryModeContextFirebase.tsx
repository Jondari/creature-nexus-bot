import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { STORY_CHAPTERS, StoryChapter } from '@/data/storyMode';
import StoryDeckGenerator from "@/utils/storyDeckGenerator";

const SCHEMA_VERSION = 1;

interface StoryProgressLight {
  schemaVersion: number;
  currentChapter: number;
  unlockedChapters: number[];
  completedBattles: Record<number, string[]>;
  lastUpdated: Date;
}

// Helper functions
function deepCloneChapters(src: StoryChapter[]): StoryChapter[] {
  return src.map(c => ({ ...c, battles: c.battles.map(b => ({ ...b })) }));
}

// Rebuild chapters UI state from the light progress model.
// Accessibility policy:
//  - Reset all nodes' accessibility.
//  - If chapter is unlocked:
//     * First node is accessible (keeps replay simple) — you may gate this by "!first.isCompleted" if preferred.
//     * Completed nodes are always accessible (explicit replay support).
//     * For each COMPLETED node, mark all DIRECT neighbors accessible if they are NOT completed.
//       Use BFS to propagate across chains of completed nodes until the next unfinished frontier.
function buildChaptersFromLight(light: StoryProgressLight, canon: StoryChapter[]): StoryChapter[] {
  const chapters = deepCloneChapters(canon);
  const unlocked = new Set(light.unlockedChapters);

  for (const ch of chapters) {
    // Chapter 1 is always unlocked; others depend on the light model
    ch.isUnlocked = unlocked.has(ch.id) || ch.id === 1;

    // Build fast lookup (robust if ids become numbers later)
    const byId = new Map<string, StoryBattle>();
    for (const b of ch.battles) {
      byId.set(String(b.id), b);
    }

    // Completed set for this chapter (light format uses string ids)
    const doneIds = new Set<string>((light.completedBattles[ch.id] || []).map(id => String(id)));

    // 1) Apply completion + reset accessibility
    for (const b of ch.battles) {
      b.isCompleted = doneIds.has(String(b.id));
      b.isAccessible = false; // recomputed below
    }

    // 2) Recompute accessibility if the chapter is unlocked
    if (ch.isUnlocked) {
      // Entry point: keep first node tappable (even if completed, to allow quick replay)
      const first = ch.battles[0];
      if (first) {
        first.isAccessible = true; // change to (!first.isCompleted) if you want stricter entry
      }

      // Completed nodes should be directly tappable (explicit replay support)
      for (const b of ch.battles) {
        if (b.isCompleted) {
          b.isAccessible = true; // allow replay on completed nodes
        }
      }

      // BFS from completed nodes to unlock the next unfinished frontier
      const queue: StoryBattle[] = ch.battles.filter(b => b.isCompleted);
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
            // Neighbor not completed → becomes available to progress
            nb.isAccessible = true;
          } else {
            // Neighbor also completed → keep traversing to reach the next unfinished node
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
    const allDone = ch.battles.every(b => b.isCompleted);
    const bossBeaten = ch.battles.some(b => b.isBoss && b.isCompleted);
    ch.isCompleted = allDone;
    if (bossBeaten || allDone) {
      const nxt = i + 1;
      if (nxt < chapters.length) chapters[nxt].isUnlocked = true;
    }
  }
  return chapters;
}

interface StoryModeContextType {
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
  const lastAppliedRef = useRef<number>(0);
  const lastUserRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUid = user?.uid ?? null;
    if (lastUserRef.current && lastUserRef.current !== currentUid) {
      AsyncStorage.removeItem('creature_nexus_story_progress_light').catch(error => {
        if (__DEV__) {
          console.warn('Failed to clear story progress cache on user switch:', error);
        }
      });
      lastAppliedRef.current = 0;
    }
    lastUserRef.current = currentUid;
  }, [user?.uid]);

  useEffect(() => {
    loadProgress();
  }, [user]);

  // Reset anti-stale guard whenever the signed-in user changes
  useEffect(() => {
    lastAppliedRef.current = 0;
  }, [user?.uid]);

  // Firebase real-time sync for story progress
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, { includeMetadataChanges: true }, async (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (!snap.exists()) return;
      const data = snap.data();
      if (!data?.storyProgressLight) return;

      // Extract and normalize lastUpdated as number
      const ts = data.storyProgressLight.lastUpdated?.toDate?.()?.getTime?.() ?? 0;
      if (ts && ts < lastAppliedRef.current) {
        // Ignore stale snapshot
        return;
      }

      const firebaseLight = data.storyProgressLight;
      const light = {
        ...firebaseLight,
        lastUpdated: firebaseLight.lastUpdated?.toDate?.() || new Date(),
      };
      const chaptersBuilt = buildChaptersFromLight(light, STORY_CHAPTERS);
      const reconciled = reconcileChapters(chaptersBuilt);
      setChapters(reconciled);
      setCurrentChapter(light.currentChapter);
      await AsyncStorage.setItem('creature_nexus_story_progress_light', JSON.stringify(light));

      // Remember last applied server timestamp
      lastAppliedRef.current = light.lastUpdated.getTime?.() ?? Date.now();
    });
    return unsub;
  }, [user]);

  const saveProgressLight = async (userId: string | undefined, light: StoryProgressLight) => {
    await AsyncStorage.setItem('creature_nexus_story_progress_light', JSON.stringify(light));
    if (userId) {
      await setDoc(doc(db, 'users', userId), { storyProgressLight: light }, { merge: true });
    }
  };

  const saveProgress = async () => {
    try {
      // Rebuild the light progress from the current state
      const unlockedChapters = chapters.filter(ch => ch.isUnlocked).map(ch => ch.id);
      const completedBattles: Record<number, string[]> = {};
      chapters.forEach(ch => {
        const completed = ch.battles.filter(b => b.isCompleted).map(b => b.id);
        if (completed.length) completedBattles[ch.id] = completed;
      });

      // Use a monotonic local timestamp for optimistic anti-stale guard
      const now = Date.now();

      const light: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter,
        unlockedChapters,
        completedBattles,
        lastUpdated: new Date(now),
      };

      // Optimistically bump the guard so older snapshots will be ignored by the listener
      lastAppliedRef.current = now;

      // Single save: local + Firestore (light)
      await saveProgressLight(user?.uid, light);
    } catch (e) {
      if (__DEV__) console.error('saveProgress (light) failed', e);
    }
  };

  const loadProgress = async () => {
    try {
      setIsLoading(true);

      let light: StoryProgressLight | null = null;

      // 1. Try to load storyProgressLight from Firebase first if user is authenticated
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().storyProgressLight) {
          const firebaseLight = userDoc.data().storyProgressLight;
          light = {
            ...firebaseLight,
            lastUpdated: firebaseLight.lastUpdated?.toDate() || new Date(),
          };
        }
      }

      // Fallback to local storyProgressLight
      if (!light) {
        const storedLight = await AsyncStorage.getItem('creature_nexus_story_progress_light');
        if (storedLight) {
          light = JSON.parse(storedLight);
          light.lastUpdated = new Date(light.lastUpdated);
          // Keep anti-stale guard in sync with the applied server state
          lastAppliedRef.current = (light.lastUpdated as Date)?.getTime?.() ?? Date.now();
        }
      }

      // 2. If storyProgressLight exists, use it
      if (light) {
        const chapters = buildChaptersFromLight(light, STORY_CHAPTERS);
        const reconciledChapters = reconcileChapters(chapters);
        setChapters(reconciledChapters);
        setCurrentChapter(light.currentChapter);
        // Keep anti-stale guard in sync with the applied server state
        lastAppliedRef.current = (light.lastUpdated as Date)?.getTime?.() ?? Date.now();
        return;
      }

      // 3. Bootstrap with defaults
      const defaultLight: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter: 1,
        unlockedChapters: [1],
        completedBattles: {},
        lastUpdated: new Date(),
      };

      await saveProgressLight(user?.uid, defaultLight);

      const chapters = buildChaptersFromLight(defaultLight, STORY_CHAPTERS);
      const reconciledChapters = reconcileChapters(chapters);
      setChapters(reconciledChapters);
      setCurrentChapter(1);
      // Baseline the anti-stale guard for a fresh default state
      lastAppliedRef.current = Date.now();
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading story progress:', error);
      }
      // Reset to default if loading fails
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
      // Create a shallow-cloned graph to avoid mutating React state directly
      const updatedChapters = chapters.map(ch => ({
        ...ch,
        battles: ch.battles.map(b => ({ ...b })),
      }));

      // Locate chapter and battle
      const chapterIndex = updatedChapters.findIndex(c => c.id === chapterId);
      if (chapterIndex === -1) return;
      const chapter = updatedChapters[chapterIndex];
      const battle = chapter.battles.find(b => b.id === battleId);
      if (!battle || battle.isCompleted) return;

      // Mark the battle as completed
      battle.isCompleted = true;

      // Unlock connected nodes within the same chapter (graph-based access)
      for (const connId of battle.connections) {
        const neighbor = chapter.battles.find(b => b.id === connId);
        if (neighbor) neighbor.isAccessible = true;
      }

      // Compute nextCurrent locally to avoid using stale state (setState is async)
      let nextCurrent = currentChapter;

      // If the boss is defeated OR the chapter is 100% completed, unlock the next chapter
      const chapterFullyCompleted = chapter.battles.every(b => b.isCompleted);
      const bossDefeated = battle.isBoss || chapter.battles.some(b => b.isBoss && b.isCompleted);

      if (bossDefeated || chapterFullyCompleted) {
        chapter.isCompleted = true;
        const nextIdx = chapterIndex + 1;
        if (nextIdx < updatedChapters.length) {
          updatedChapters[nextIdx].isUnlocked = true;
          nextCurrent = updatedChapters[nextIdx].id; // ensure we persist the new current chapter
        }
      }

      // Reconcile all derived flags (unlocked/completed) before persisting
      const reconciled = reconcileChapters(updatedChapters);

      // Apply state updates
      setChapters(reconciled);
      setCurrentChapter(nextCurrent);

      // Build the light progress view from the reconciled state
      const unlockedChapters = reconciled.filter(c => c.isUnlocked).map(c => c.id);
      const completedBattles: Record<number, string[]> = Object.fromEntries(
          reconciled.map(c => [c.id, c.battles.filter(b => b.isCompleted).map(b => b.id)])
      );

      // Persist light-only progress (local + Firestore)
      const lightProgress: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter: nextCurrent, // persist the computed chapter id, not the old state
        unlockedChapters,
        completedBattles,
        lastUpdated: new Date(),
      };
      await saveProgressLight(user?.uid, lightProgress);
    } catch (error) {
      if (__DEV__) console.error('completeBattle failed:', error);
    }
  };

  const unlockChapter = async (chapterId: number) => {
    try {
      // Clone to avoid mutating state directly
      const updatedChapters = chapters.map(ch => ({
        ...ch,
        battles: ch.battles.map(b => ({ ...b })),
      }));

      const chapter = updatedChapters.find(c => c.id === chapterId);
      if (chapter && !chapter.isUnlocked) {
        // Mark chapter as unlocked
        chapter.isUnlocked = true;

        // Make the first node tappable right away (better UX)
        const first = chapter.battles[0];
        if (first && !first.isCompleted) {
          first.isAccessible = true; // ensure immediate access to the entry node
        }

        // Push to UI
        setChapters(updatedChapters);

        // Persist light-only progress
        await saveProgress();
      }
    } catch (error) {
      if (__DEV__) console.error('Error unlocking chapter:', error);
    }
  };

  const resetProgress = async () => {
    try {
      // Clear both heavy and light progress from Firebase
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { 
          storyProgress: null,
          storyProgressLight: null 
        }, { merge: true });
      }

      // Clear local storage
      await AsyncStorage.removeItem('creature_nexus_story_progress_light');

      // Bootstrap default light progress
      const defaultLight: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter: 1,
        unlockedChapters: [1],
        completedBattles: {},
        lastUpdated: new Date(),
      };

      await saveProgressLight(user?.uid, defaultLight);

      // Load from default light progress
      const chapters = buildChaptersFromLight(defaultLight, STORY_CHAPTERS);
      const reconciledChapters = reconcileChapters(chapters);
      setChapters(reconciledChapters);
      setCurrentChapter(1);
    } catch (error) {
      if (__DEV__) {
        console.error('Error resetting progress:', error);
      }
    }
  };

  const unlockAllChapters = async () => {
    try {
      // Decide a clear current chapter for DEV (1 is predictable and safe)
      const targetCurrent = 1;

      // Unlock every chapter; do not auto-complete battles by default
      const allChapterIds = STORY_CHAPTERS.map(ch => ch.id);

      // Persist a clean light structure
      const lightProgress: StoryProgressLight = {
        schemaVersion: SCHEMA_VERSION,
        currentChapter: targetCurrent,
        unlockedChapters: allChapterIds,
        completedBattles: {}, // keep empty for "unlocked but not completed"; fill to simulate 100%
        lastUpdated: new Date(),
      };
      await saveProgressLight(user?.uid, lightProgress);

      // Rebuild UI state from the just-persisted light structure
      const built = buildChaptersFromLight(lightProgress, STORY_CHAPTERS);
      const reconciled = reconcileChapters(built);
      setChapters(reconciled);
      setCurrentChapter(targetCurrent);
    } catch (error) {
      if (__DEV__) console.error('unlockAllChapters failed:', error);
    }
  };

  const getChapterProgress = (chapterId: number) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = chapter.battles.filter(b => b.isCompleted).length;
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
