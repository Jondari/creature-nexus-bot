/**
 * Extended Story Progress Types
 * 
 * Extends the existing StoryProgressLight interface to include tutorial
 * and scene system integration while maintaining backwards compatibility.
 */

import type { TutorialProgress } from './scenes';

// Original StoryProgressLight interface (for backwards compatibility)
export interface StoryProgressLight {
  schemaVersion: number;
  currentChapter: number;
  unlockedChapters: number[];
  completedBattles: Record<number, string[]>;
  lastUpdated: Date;
  
  // New: Tutorial and scenes integration
  tutorial?: TutorialProgress;
}

// Extended story battle interface to support scene triggers
export interface StoryBattleExtended {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'boss';
  isCompleted: boolean;
  isAccessible: boolean;
  prerequisites: string[];
  rewards?: {
    nexusCoins: number;
    packs?: string[];
    cards?: string[];
  };
  
  // Scene triggers
  preScenes?: string[]; // Scene IDs to trigger before battle
  postScenes?: string[]; // Scene IDs to trigger after battle (win)
  defeatScenes?: string[]; // Scene IDs to trigger after defeat
  
  // Battle configuration
  enemyDeck?: string; // Deck configuration ID
  specialRules?: string[]; // Special battle conditions
}

// Extended chapter interface
export interface StoryChapterExtended {
  id: number;
  title: string;
  description: string;
  isUnlocked: boolean;
  battles: StoryBattleExtended[];
  
  // Scene triggers
  introScene?: string; // Scene to play when entering chapter
  outroScene?: string; // Scene to play when completing chapter
  
  // Chapter metadata
  theme?: 'water' | 'fire' | 'earth' | 'air' | 'mixed';
  backgroundMusic?: string;
  chapterImage?: string;
}

// Story mode integration utilities
export class StorySceneIntegration {
  /**
   * Check if a battle should trigger a pre-battle scene
   */
  static shouldTriggerPreBattleScene(
    chapterId: number, 
    battleId: string, 
    completedScenes: string[]
  ): string | null {
    // Implementation would check battle configuration and scene completion status
    const sceneId = `battle_${chapterId}_${battleId}_pre`;
    return completedScenes.includes(sceneId) ? null : sceneId;
  }
  
  /**
   * Check if a battle should trigger a post-battle scene
   */
  static shouldTriggerPostBattleScene(
    chapterId: number, 
    battleId: string, 
    result: 'win' | 'lose',
    completedScenes: string[]
  ): string | null {
    const sceneId = `battle_${chapterId}_${battleId}_${result}`;
    return completedScenes.includes(sceneId) ? null : sceneId;
  }
  
  /**
   * Get all scene IDs related to a chapter
   */
  static getChapterSceneIds(chapterId: number): string[] {
    return [
      `chapter_${chapterId}_intro`,
      `chapter_${chapterId}_outro`,
      // Add battle scene IDs as needed
    ];
  }
  
  /**
   * Check if a chapter's intro scene should be triggered
   */
  static shouldTriggerChapterIntro(
    chapterId: number, 
    isFirstVisit: boolean,
    completedScenes: string[]
  ): string | null {
    if (!isFirstVisit) return null;
    
    const sceneId = `chapter_${chapterId}_intro`;
    return completedScenes.includes(sceneId) ? null : sceneId;
  }
}

// Tutorial integration helpers
export class TutorialIntegration {
  /**
   * Tutorial flags for story mode integration
   */
  static readonly FLAGS = {
    FIRST_STORY_VISIT: 'tutorial_first_story_visit',
    FIRST_BATTLE_START: 'tutorial_first_battle_start',
    FIRST_BATTLE_WIN: 'tutorial_first_battle_win',
    CHAPTER_MAP_EXPLAINED: 'tutorial_chapter_map_explained',
    DIFFICULTY_EXPLAINED: 'tutorial_difficulty_explained',
    REPLAY_EXPLAINED: 'tutorial_replay_explained',
  } as const;
  
  /**
   * Progress keys for story mode
   */
  static readonly PROGRESS = {
    BATTLES_WON: 'battles_won',
    BATTLES_LOST: 'battles_lost',
    CHAPTERS_COMPLETED: 'chapters_completed',
    TOTAL_PLAY_TIME: 'total_play_time',
  } as const;
  
  /**
   * Check if tutorial should be shown for story mode
   */
  static shouldShowStoryTutorial(tutorialProgress?: TutorialProgress): boolean {
    if (!tutorialProgress) return true;
    return !tutorialProgress.flags[TutorialIntegration.FLAGS.FIRST_STORY_VISIT];
  }
  
  /**
   * Check if battle tutorial should be shown
   */
  static shouldShowBattleTutorial(tutorialProgress?: TutorialProgress): boolean {
    if (!tutorialProgress) return true;
    return !tutorialProgress.flags[TutorialIntegration.FLAGS.FIRST_BATTLE_START];
  }
  
  /**
   * Update story-related progress
   */
  static updateStoryProgress(
    tutorialProgress: TutorialProgress,
    event: 'battle_won' | 'battle_lost' | 'chapter_completed'
  ): TutorialProgress {
    const updated = { ...tutorialProgress };
    
    switch (event) {
      case 'battle_won':
        updated.progress[TutorialIntegration.PROGRESS.BATTLES_WON] = 
          (updated.progress[TutorialIntegration.PROGRESS.BATTLES_WON] || 0) + 1;
        break;
      
      case 'battle_lost':
        updated.progress[TutorialIntegration.PROGRESS.BATTLES_LOST] = 
          (updated.progress[TutorialIntegration.PROGRESS.BATTLES_LOST] || 0) + 1;
        break;
      
      case 'chapter_completed':
        updated.progress[TutorialIntegration.PROGRESS.CHAPTERS_COMPLETED] = 
          (updated.progress[TutorialIntegration.PROGRESS.CHAPTERS_COMPLETED] || 0) + 1;
        break;
    }
    
    return updated;
  }
}

// Scene trigger helpers for story mode
export const STORY_SCENE_TRIGGERS = {
  // Chapter entrance
  createChapterEnterTrigger: (chapterId: number) => ({
    type: 'onEnterScreen' as const,
    screen: 'chapter-map' as const,
  }),
  
  // Battle triggers
  createBattleStartTrigger: (chapterId: number, battleId: string) => ({
    type: 'onBattleStart' as const,
    chapterId,
    battleId,
  }),
  
  createBattleEndTrigger: (result: 'win' | 'lose') => ({
    type: 'onBattleEnd' as const,
    result,
  }),
  
  // Story progression
  createStoryProgressTrigger: (chapterId: number, battleId?: string) => ({
    type: 'onStoryProgress' as const,
    chapterId,
    battleId,
  }),
} as const;

// Migration utilities for existing data
export class StoryProgressMigration {
  /**
   * Migrate existing StoryProgressLight to include tutorial data
   */
  static migrateToExtended(
    existing: Omit<StoryProgressLight, 'tutorial'>
  ): StoryProgressLight {
    return {
      ...existing,
      tutorial: {
        flags: {},
        progress: {},
        completedScenes: [],
        lastSeenAt: {},
      },
    };
  }
  
  /**
   * Check if migration is needed
   */
  static needsMigration(progress: any): boolean {
    return progress && !progress.tutorial;
  }
  
  /**
   * Safely get tutorial progress with fallback
   */
  static getTutorialProgress(progress?: StoryProgressLight): TutorialProgress {
    return progress?.tutorial || {
      flags: {},
      progress: {},
      completedScenes: [],
      lastSeenAt: {},
    };
  }
}