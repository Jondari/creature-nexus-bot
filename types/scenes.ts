/**
 * Scenes Engine Types
 * 
 * Comprehensive type definitions for the unified Scenes Engine that powers
 * both tutorial system and story narrative with visual novel capabilities.
 */

// Scene trigger conditions
export type SceneTrigger =
  | { type: 'onFirstLaunch' }
  | { type: 'onEnterScreen'; screen: 'home' | 'battle' | 'story-mode' | 'chapter-map' | 'collection' | 'decks' | 'store' }
  | { type: 'onBattleStart'; chapterId?: number; battleId?: string }
  | { type: 'onBattleEnd'; result: 'win' | 'lose' | 'any' }
  | { type: 'onBattleAction'; action: 'cardPlayed' | 'attackUsed' | 'cardRetired' | 'turnEnded' }
  | { type: 'onStoryProgress'; chapterId: number; battleId?: string }
  | { type: 'onPackOpened'; packType?: string }
  | { type: 'onAchievement'; achievementId: string }
  | { type: 'manual'; id: string };

// Scene command system (DSL for describing scene flow)
export type SceneCommand =
  // Flow control
  | { type: 'label'; name: string }
  | { type: 'goto'; label: string }
  | { type: 'if'; flag: string; then?: string; else?: string }
  | { type: 'end' }
  
  // Narrative
  | { type: 'say'; speaker?: string; text: string; portrait?: string }
  | { type: 'choice'; choices: { id: string; text: string; goto?: string; setFlags?: Record<string, boolean> }[] }
  | { type: 'wait'; ms: number }
  
  // UI interaction and highlights
  | { type: 'highlight'; anchorId: string; text?: string; maskInput?: boolean; style?: HighlightStyle; textPosition?: 'top' | 'bottom' }
  | { type: 'maskInput'; enabled: boolean }
  | { type: 'showHint'; text: string; anchorId?: string; duration?: number }
  
  // State management
  | { type: 'setFlag'; key: string; value: boolean }
  | { type: 'setProgress'; key: string; value: number }
  | { type: 'checkProgress'; key: string; min?: number; max?: number; then?: string; else?: string }
  
  // Visual novel features
  | { type: 'setBackground'; uri: string | number; transition?: 'fade' | 'slide' | 'none' }
  | { type: 'showPortrait'; side: 'left' | 'right'; uri: string | number; animation?: 'slideIn' | 'fadeIn' | 'none'; mirror?: boolean }
  | { type: 'hidePortrait'; side: 'left' | 'right'; animation?: 'slideOut' | 'fadeOut' | 'none' }
  | { type: 'imageOverlay'; uri: string | number; x: number; y: number; width?: number; height?: number; duration?: number }
  | { type: 'playSound'; uri: string; loop?: boolean }
  | { type: 'playMusic'; uri: string; loop?: boolean; fadeIn?: boolean }
  | { type: 'stopMusic'; fadeOut?: boolean }
  
  // Game actions
  | { type: 'triggerBattle'; chapterId: number; battleId: string }
  | { type: 'triggerReward'; type: 'pack' | 'cards' | 'coins'; data: any }
  | { type: 'navigateTo'; screen: string; params?: Record<string, any> };

// Highlight styling options
export interface HighlightStyle {
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  backgroundColor?: string;
  shadowColor?: string;
  shadowOpacity?: number;
  pulsate?: boolean;
  glow?: boolean;
}

// Scene specification
export interface SceneSpec {
  id: string;
  version: number;
  title?: string;
  description?: string;
  triggers: SceneTrigger[];
  steps: SceneCommand[];
  
  // Visual novel assets
  backgroundImage?: string | number;
  music?: string;
  
  // Metadata
  tags?: string[];
  priority?: number; // Higher priority scenes override lower ones
  conditions?: { // Additional conditions beyond triggers
    flags?: Record<string, boolean>;
    progress?: Record<string, number>;
    minLevel?: number;
    maxLevel?: number;
  };
  
  // Localization support
  locale?: string;
  localizedAssets?: Record<string, { backgroundImage?: string; music?: string }>;
}

// Tutorial progress extension for StoryProgressLight
export interface TutorialProgress {
  flags: Record<string, boolean>;
  progress: Record<string, number>;
  completedScenes: string[];
  lastSeenAt: Record<string, number>; // scene_id -> timestamp
  currentScene?: {
    sceneId: string;
    stepIndex: number;
    timestamp: number;
  };
}

// Extended StoryProgressLight with tutorial data
export interface StoryProgressLight {
  schemaVersion: number;
  currentChapter: number;
  unlockedChapters: number[];
  completedBattles: Record<number, string[]>;
  lastUpdated: Date;
  tutorial?: TutorialProgress;
}

// Anchors system for UI highlighting
export type AnchorRect = { x: number; y: number; width: number; height: number };
export type AnchorMeasureFn = () => Promise<AnchorRect | null>;

export interface AnchorsAPI {
  register: (id: string, measure: AnchorMeasureFn) => void;
  unregister: (id: string) => void;
  getRect: (id: string) => Promise<AnchorRect | null>;
  getAllAnchors: () => string[];
}

// Scene execution state
export interface SceneState {
  sceneId: string;
  stepIndex: number;
  flags: Record<string, boolean>;
  progress: Record<string, number>;
  labels: Record<string, number>; // label_name -> step_index
  
  // UI state
  dialog: {
    speaker?: string;
    text?: string;
    portrait?: string;
    choices?: { id: string; text: string; goto?: string; setFlags?: Record<string, boolean> }[];
  } | null;
  
  highlight: {
    rect: AnchorRect | null;
    text?: string;
    style?: HighlightStyle;
    maskInput?: boolean;
    textPosition?: 'top' | 'bottom';
  } | null;
  
  visuals: {
    background?: string | number;
    portraits: { left?: string | number; right?: string | number };
    overlays: Array<{
      id: string;
      uri: string | number;
      x: number;
      y: number;
      width?: number;
      height?: number;
    }>;
  };
  
  audio: {
    currentMusic?: string;
    sounds: string[];
  };
  
  maskInput: boolean;
  isWaitingForInput: boolean;
}

// Scene manager interface
export interface SceneManagerAPI {
  // Scene execution
  startScene: (sceneId: string) => Promise<boolean>;
  stopCurrentScene: () => void;
  getCurrentScene: () => { scene: SceneSpec; state: SceneState } | null;
  
  // Scene registration
  registerScene: (scene: SceneSpec) => void;
  unregisterScene: (sceneId: string) => void;
  getScene: (sceneId: string) => SceneSpec | null;
  getAllScenes: () => SceneSpec[];
  
  // Trigger system
  checkTriggers: (trigger: SceneTrigger) => Promise<void>;
  evaluateSceneConditions: (scene: SceneSpec) => boolean;
  
  // State management
  getFlag: (key: string) => boolean;
  setFlag: (key: string, value: boolean) => void;
  getProgress: (key: string) => number;
  setProgress: (key: string, value: number) => void;
  
  // Scene history
  markSceneCompleted: (sceneId: string) => void;
  isSceneCompleted: (sceneId: string) => boolean;
  getCompletedScenes: () => string[];
  resetSceneHistory: (sceneId: string) => void;
  
  // Persistence
  saveTutorialProgress: () => Promise<void>;

  // Domain events publish API (decoupled surface for gameplay)
  publishUserEvent?: (event: SceneUserEvent) => void;
}

// Scene runner component props
export interface SceneRunnerProps {
  scene: SceneSpec;
  onFinish: () => void;
  onSceneAction?: (action: string, data: any) => void;
  initialState?: Partial<SceneState>;
}

// Events that scenes can listen to or trigger
export type SceneEvent =
  | { type: 'scene_started'; sceneId: string }
  | { type: 'scene_finished'; sceneId: string; reason: 'completed' | 'interrupted' | 'error' }
  | { type: 'scene_step'; sceneId: string; stepIndex: number; command: SceneCommand }
  | { type: 'flag_changed'; key: string; oldValue: boolean; newValue: boolean }
  | { type: 'progress_changed'; key: string; oldValue: number; newValue: number }
  | { type: 'choice_selected'; choiceId: string; sceneId: string }
  | { type: 'anchor_highlighted'; anchorId: string; sceneId: string }
  | { type: 'user_input'; inputType: 'tap' | 'choice' | 'skip'; data?: any };

// Domain-level user events that gameplay can publish without depending on scenes
export type SceneUserEvent =
  | { type: 'card_played' }
  | { type: 'creature_selected' }
  | { type: 'attack_used' }
  | { type: 'turn_ended' };

// Scene debugging interface (dev mode)
export interface SceneDebugger {
  isEnabled: boolean;
  currentScene?: SceneSpec;
  currentState?: SceneState;
  stepHistory: Array<{ stepIndex: number; command: SceneCommand; timestamp: number }>;
  
  // Debug actions
  stepForward: () => void;
  stepBackward: () => void;
  jumpToStep: (stepIndex: number) => void;
  jumpToLabel: (labelName: string) => void;
  restartScene: () => void;
  skipScene: () => void;
  
  // State inspection
  inspectFlags: () => Record<string, boolean>;
  inspectProgress: () => Record<string, number>;
  inspectAnchors: () => string[];
  
  // Scene editing
  modifyStep: (stepIndex: number, newCommand: SceneCommand) => void;
  insertStep: (stepIndex: number, command: SceneCommand) => void;
  deleteStep: (stepIndex: number) => void;
}

// Predefined scene collections
export interface SceneCollection {
  id: string;
  name: string;
  description?: string;
  scenes: SceneSpec[];
  tags?: string[];
}

// Scene analytics data
export interface SceneAnalytics {
  sceneId: string;
  userId: string;
  startedAt: number;
  completedAt?: number;
  stepsDuration: number[];
  choicesMade: Array<{ stepIndex: number; choiceId: string; timestamp: number }>;
  flagsSet: Array<{ key: string; value: boolean; timestamp: number }>;
  anchorsHighlighted: Array<{ anchorId: string; timestamp: number; duration: number }>;
  interrupted?: { stepIndex: number; reason: string; timestamp: number };
}

// Export commonly used constant types
export const SCENE_TRIGGERS = {
  FIRST_LAUNCH: 'onFirstLaunch' as const,
  ENTER_HOME: { type: 'onEnterScreen' as const, screen: 'home' as const },
  ENTER_BATTLE: { type: 'onEnterScreen' as const, screen: 'battle' as const },
  ENTER_STORY: { type: 'onEnterScreen' as const, screen: 'story-mode' as const },
  BATTLE_WIN: { type: 'onBattleEnd' as const, result: 'win' as const },
  BATTLE_LOSE: { type: 'onBattleEnd' as const, result: 'lose' as const },
  CARD_PLAYED: { type: 'onBattleAction' as const, action: 'cardPlayed' as const },
} as const;

export const COMMON_ANCHORS = {
  // Home screen anchors
  OPEN_PACK_BUTTON: 'openPackBtn',
  PACK_INVENTORY: 'packInventory',

  // Battle screen anchors
  HAND_AREA: 'handArea',
  FIELD_AREA: 'fieldArea',
  ENEMY_FIELD: 'enemyField',
  END_TURN_BUTTON: 'endTurnBtn',
  ENERGY_DISPLAY: 'energyDisplay',
  PLAYER_HP: 'playerHp',
  ENEMY_HP: 'enemyHp',
  TURN_STATUS: 'turnStatus',
  
  // Story mode anchors
  CHAPTER_NODE: 'chapterNode',
  BATTLE_NODE: 'battleNode',
  NEXT_CHAPTER_BUTTON: 'nextChapterBtn',
  
  // Collection anchors
  CARD_GRID: 'cardGrid',
  
  // Decks & deck builder anchors
  DECK_BUILDER_ENTRY: 'deckBuilderEntry',
  DECK_EDITOR_INFO: 'deckEditorInfo',
  DECK_EDITOR_FILTERS: 'deckEditorFilters',
  DECK_EDITOR_GRID: 'deckEditorGrid',
  DECK_EDITOR_CURRENT_DECK_BUTTON: 'deckEditorCurrentDeckBtn',
  DECK_EDITOR_SAVE_BUTTON: 'deckEditorSaveBtn',

  // Store anchors
  PACK_SHOP: 'packShop',
  COIN_BALANCE: 'coinBalance',
} as const;
