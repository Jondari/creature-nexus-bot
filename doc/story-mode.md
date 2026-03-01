# Story Mode

> Technical documentation for the Story Mode system in Creature Nexus TCG.
> Progressively built from v0.19.0 to v0.23.0. Status: **~80% complete** — infrastructure production-ready, narrative content incomplete.

---

## Overview

Story Mode is the main game mode, offering a narrative progression through 6 elemental chapters with 30+ battles. Players navigate a constellation-style map, fight AI opponents with themed decks, and unlock chapters by completing battles.

### Current Status

| Aspect | Status | Notes |
|--------|--------|-------|
| Infrastructure | Done | Architecture, contexts, persistence |
| Progression system | Done | Firebase + AsyncStorage, BFS unlock |
| UI/UX | Done | Map, animations, chapter themes |
| Battle integration | Done | AI deck generation, win/loss reasons |
| Narrative content | Incomplete | Scenes in `story-scenes.ts` are commented out |
| Audio | Stub | Commands exist but produce no output |
| Assets | Partial | Chapter 1 portraits present, chapters 2-6 missing |

---

## Architecture

### Files

| File | Role |
|------|------|
| `context/StoryModeContext.tsx` | State management, persistence, progression logic |
| `data/storyMode.ts` | Chapter and battle definitions |
| `data/scenes/story-scenes.ts` | Narrative scene specifications (mostly commented) |
| `utils/storyDeckGenerator.ts` | AI deck generation per chapter/difficulty |
| `types/scenes.ts` | Scene engine type definitions |
| `types/story-extended.ts` | Extended types, tutorial integration constants |
| `app/(tabs)/story-mode.tsx` | Chapter selection screen |
| `app/(tabs)/chapter-map.tsx` | Battle map screen |
| `app/(tabs)/story-battle.tsx` | Battle execution screen |
| `components/ChapterSelection.tsx` | Chapter card list UI |
| `components/StoryMap.tsx` | SVG constellation map with battle nodes |
| `components/SceneRunner.tsx` | Visual novel scene engine |
| `utils/sceneImageManager.ts` | Scene asset management |

---

## Chapters

### 6 Elemental Chapters

| # | Name | Element | Color Theme | Battles |
|---|------|---------|-------------|---------|
| 1 | Central Nexus World | All | Purple (`#8B5CF6`) | 4 + boss |
| 2 | Water World | Water | Blue (`#0EA5E9`) | 5 + boss |
| 3 | Fire World | Fire | Orange (`#F97316`) | 5 + boss |
| 4 | Earth World | Earth | Green (`#65A30D`) | 5 + boss |
| 5 | Air World | Air | Silver (`#E5E7EB`) | 5 + boss |
| 6 | The Return to the Final Nexus | All | Deep Purple (`#7C3AED`) | 4 + boss |

### Data Structure

```typescript
interface StoryChapter {
  id: number;
  name: string;                    // i18n key
  description: string;             // i18n key
  element: Element;                // 'fire' | 'water' | 'earth' | 'air' | 'all'
  colorTheme: { primary, secondary, accent, background };
  battles: StoryBattle[];
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface StoryBattle {
  id: string;
  name: string;                    // i18n key
  description: string;             // i18n key
  x: number; y: number;           // Position on map (0-100)
  connections: string[];           // IDs of next battles
  isCompleted: boolean;
  isAccessible: boolean;
  isBoss: boolean;
}
```

---

## Progression System

### Unlock Algorithm

BFS-based graph unlocking — completing a battle unlocks its neighbors. See `StoryModeContext.tsx` for implementation details.

### Persistence

#### Data Model (StoryProgressLight)

```typescript
interface StoryProgressLight {
  schemaVersion: number;
  currentChapter: number;
  unlockedChapters: number[];
  completedBattles: Record<number, string[]>;  // chapterId → [battleIds]
  lastUpdated: Date;
}
```

#### Dual Storage

| Layer | Technology |
|-------|-----------|
| Local | AsyncStorage |
| Cloud | Firebase Firestore |

#### Sync Flow

1. Firebase real-time listener (`onSnapshot`) watches for changes
2. Anti-stale guard: `lastAppliedRef` prevents older snapshots from overwriting newer data
3. On update: `buildChaptersFromLight()` → `reconcileChapters()` → UI re-render
4. Optimistic updates: local state updated immediately, then persisted
5. Cache cleared on user change

---

## Battle Integration

### AI Deck Generation (`utils/storyDeckGenerator.ts`)

Decks are generated per chapter with difficulty-based rarity weights and seeded RNG for replay consistency. See source code for configuration details.

### Battle Completion Flow

```
Player wins battle
  → handleBattleComplete() in story-battle.tsx
  → completeBattle(chapterId, battleId) in StoryModeContext
  → Battle marked completed, neighbors unlocked (BFS)
  → If boss defeated or 100% complete → next chapter unlocked
  → Progress persisted to AsyncStorage + Firebase
  → Victory alert with win reason (points/deckout/fieldwipe)
  → Navigate back to chapter-map
```

### Validation Before Battle

- Player must have at least one saved deck
- Chapter and battle must exist
- Battle must be accessible (not locked)
- Completed battles can be replayed (confirmation dialog)

---

## UI Components

### ChapterSelection

Scrollable list of chapter cards with:
- Color-coded gradients per chapter theme
- Progress bars (completed/total battles)
- Lock icons for inaccessible chapters, checkmarks for completed
- Element icons and progress percentage

### StoryMap

SVG constellation-style map:
- Random star background
- Battle nodes: 15px circles (regular), 25px with gradient + pulse (boss)
- Colors: gold (`#FFD700`) for completed, chapter color for accessible, gray for locked
- Connection lines: solid colored (completed), dashed gray (locked)
- Sequential fade-in animation (150ms stagger per node)
- Pulsing animation on accessible battles (2s loop)

---

## Scene Engine (SceneRunner)

The SceneRunner is a visual novel engine that can display dialogues, portraits, backgrounds, and branching choices before/after battles.

### Available Commands

| Command | Description | Status |
|---------|-------------|--------|
| `say` | Dialogue with speaker and text | Working |
| `choice` | Multiple choices with branching | Working |
| `showPortrait` | Show character (left/right, slideIn/fadeIn) | Working |
| `hidePortrait` | Hide character (slideOut) | Working |
| `setBackground` | Change background image (with transition) | Working |
| `imageOverlay` | Image overlay | Working |
| `highlight` | Highlight UI element | Working |
| `setFlag` | Set a state flag | Working |
| `goto` / `label` | Jump to a named label | Working |
| `wait` | Timed pause | Working |
| `maskInput` | Block user inputs | Working |
| `triggerReward` | Trigger reward | Stub |
| `playSound` | Play sound effect | Stub (no output) |
| `playMusic` | Play background music | Stub (no output) |
| `stopMusic` | Stop music | Stub (no output) |

### Scene Format Example

```typescript
const scene: SceneSpec = {
  id: 'chapter1_intro',
  steps: [
    { command: 'setBackground', background: 'nexus_bg.png', transition: 'fade' },
    { command: 'showPortrait', character: 'guide', image: 'guide_portrait.png',
      position: 'left', animation: 'slideIn' },
    { command: 'say', speaker: 'i18n:characters.guide.name',
      text: 'i18n:story.chapter1.intro.welcome' },
    { command: 'choice', prompt: 'i18n:story.chapter1.intro.choice_prompt',
      options: [
        { text: 'i18n:story.chapter1.intro.choice_ready', effect: { goto: 'start_battle' } },
        { text: 'i18n:story.chapter1.intro.choice_explain', effect: { goto: 'tutorial' } },
      ] },
  ],
};
```

---

## Assets

### Present

```
assets/images/scene/
├── nexus_bg.png, nexus_welcome_bg.png
├── battle_tutorial.png, victory_bg.png, defeat_bg.png
├── guide_portrait.png, merchant_portrait.png
├── strategist_portrait.png, archivist_portrait.png
└── chap1/
    ├── selel_portrait.png, selel_smiling.png
    ├── corrupted_nixeth.png, shadow_figure.png
    └── temple_guardian.png
```

### Missing

| Type | Needed For |
|------|-----------|
| Backgrounds | Chapters 2-6 (water, fire, earth, air realms) |
| Portraits | Characters for chapters 2-6 |
| Boss visuals | Boss illustrations per chapter |
| Atmospheric effects | Element-specific ambient visuals |

---

## i18n

### Key Structure

```
story.menu.title / .subtitle / .footer
story.chapter.label / .locked / .progressFull / .progressShort
story.chapterMap.loading / .progress / .completed / .difficulty.*
story.battleComplete.victoryTitle / .victoryMessage / .defeatTitle / .defeatMessage
story.noDecksAvailable.title / .message
story.leaveBattle.*
story.data.chapter_X.name / .description / .battles.{battleId}.name / .description
```

All 6 chapters with ~6 battles each = ~36 battle name/description entries per language (FR/EN).

---

## Development Utilities

Available via `useStoryMode()`:

```typescript
resetProgress()        // Reset all progression to defaults
unlockAllChapters()    // Unlock every chapter (without completing battles)
completeBattle(id, id) // Manually mark a battle as completed
getChapterProgress(id) // Returns { completed, total, percentage }
```

---

## Context API

```typescript
interface StoryModeContextType {
  chapters: StoryChapter[];
  currentChapter: number;
  isLoading: boolean;
  completeBattle: (chapterId: number, battleId: string) => Promise<void>;
  unlockChapter: (chapterId: number) => Promise<void>;
  resetProgress: () => Promise<void>;
  unlockAllChapters: () => Promise<void>;
  getChapterProgress: (chapterId: number) => { completed; total; percentage };
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}
```

---

## What's Left to Build

### Priority 1 — Narrative Content

- Uncomment and complete `data/scenes/story-scenes.ts`
- Write scenes for each battle: `pre_battle`, `post_victory`, `post_defeat`
- Write chapter intros and outros
- Create missing portraits and backgrounds

### Priority 2 — Audio

- Wire `playSound` / `playMusic` / `stopMusic` to the sound manager
- Source or create music per chapter and ambient sounds

### Priority 3 — Chapters 2-6 Content

- Repeat narrative work for each elemental chapter
- Create element-specific assets
- Test full progression from chapter 1 through 6

### Priority 4 — Polish

- Intro/outro cinematics
- Narrative branching with flags
- Visual rewards on boss defeat
- Story-linked achievements
- New Game+ or difficulty modes

---

## Version History

| Version | Story Mode Changes |
|---------|--------------------|
| v0.23.0 | Win/loss reason display in story battles |
| v0.22.0 | Win reason extension to story mode |
| v0.21.0 | Cache cleared on user change |
| v0.20.0 | Unified scene engine |
| v0.19.0 | Lightweight Firebase persistence |

---

*Last updated: February 2026*
