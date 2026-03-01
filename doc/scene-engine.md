# Scene Engine

> Technical documentation for the Scene DSL, SceneManager, and Anchors system in Creature Nexus TCG.
> Powers both the tutorial system and story mode narratives.
> Introduced in v0.6.0 (September 2025), enhanced with tutorials in v0.14.0.

---

## Overview

The Scene Engine is a visual novel / interactive scripting system that drives tutorials and story narratives. It consists of three layers:

1. **Scene DSL** — A command-based language for describing scene flow (dialogs, portraits, highlights, branching).
2. **SceneManager** — The orchestration context that registers scenes, evaluates triggers, manages state, and runs the SceneRunner overlay.
3. **Anchors** — A UI measurement system that lets scenes highlight specific elements on screen.

---

## Architecture

| File | Role |
|------|------|
| `types/scenes.ts` | All type definitions: commands, triggers, state, API |
| `context/SceneManagerContext.tsx` | Central orchestration context + hooks |
| `context/AnchorsContext.tsx` | UI anchor registration and measurement |
| `components/SceneRunner.tsx` | Visual overlay that executes scene commands |
| `components/ScenesRegistry.tsx` | Registers all tutorial scenes on mount + preloads assets |
| `data/scenes/tutorial-scenes.ts` | Tutorial scene definitions |
| `data/scenes/story-scenes.ts` | Story narrative scene definitions |
| `utils/sceneImageManager.ts` | Scene asset loading and caching |
| `hooks/useAnchorPolling.ts` | Polling mechanism for anchor availability |

---

## Scene DSL — Commands

### Flow Control

| Command | Fields | Description |
|---------|--------|-------------|
| `label` | `name` | Named jump target |
| `goto` | `label` | Jump to a label |
| `if` | `flag`, `then?`, `else?` | Conditional branch based on a boolean flag |
| `checkProgress` | `key`, `min?`, `max?`, `then?`, `else?` | Branch based on a numeric progress value |
| `end` | — | End the scene |

### Narrative

| Command | Fields | Description |
|---------|--------|-------------|
| `say` | `speaker?`, `text`, `portrait?` | Show dialog box (tap to advance) |
| `choice` | `choices[]` (id, text, goto?, setFlags?) | Show multiple-choice buttons |
| `wait` | `ms` | Pause for a duration |

### UI Interaction

| Command | Fields | Description |
|---------|--------|-------------|
| `highlight` | `anchorId`, `text?`, `maskInput?`, `style?`, `textPosition?` | Highlight a UI anchor with optional tooltip |
| `maskInput` | `enabled` | Block/unblock all user input |
| `showHint` | `text`, `anchorId?`, `duration?` | Temporary hint popup (auto-dismiss) |

### State Management

| Command | Fields | Description |
|---------|--------|-------------|
| `setFlag` | `key`, `value` | Set a boolean flag |
| `setProgress` | `key`, `value` | Set a numeric progress value |

### Visual Novel

| Command | Fields | Description |
|---------|--------|-------------|
| `setBackground` | `uri`, `transition?` (`fade`/`slide`/`none`) | Change background image |
| `showPortrait` | `side` (`left`/`right`), `uri`, `animation?`, `mirror?` | Show character portrait |
| `hidePortrait` | `side`, `animation?` | Hide character portrait |
| `imageOverlay` | `uri`, `x`, `y`, `width?`, `height?`, `duration?` | Positioned image overlay |

### Audio (stubs)

| Command | Fields | Status |
|---------|--------|--------|
| `playSound` | `uri`, `loop?` | Stub (no output) |
| `playMusic` | `uri`, `loop?`, `fadeIn?` | Stub (no output) |
| `stopMusic` | `fadeOut?` | Stub (no output) |

### Game Actions

| Command | Fields | Description |
|---------|--------|-------------|
| `triggerBattle` | `chapterId`, `battleId` | Launch a story battle |
| `triggerReward` | `type` (`pack`/`cards`/`coins`), `data` | Trigger reward display (stub) |
| `navigateTo` | `screen`, `params?` | Navigate to an app screen |

### i18n Support

Text fields in `say` and `choice` commands support i18n prefixes:

```typescript
{ type: 'say', speaker: 'i18n:characters.guide.name', text: 'i18n:story.chapter1.intro.welcome' }
```

The `i18n:` prefix is resolved at runtime via `t(key)`.

---

## Trigger System

Scenes are triggered by game events. Each scene declares one or more triggers:

| Trigger Type | Fields | When it fires |
|-------------|--------|---------------|
| `onFirstLaunch` | — | First app launch |
| `onEnterScreen` | `screen` | Navigating to a screen |
| `onBattleStart` | `chapterId?`, `battleId?` | Battle begins |
| `onBattleEnd` | `result` (`win`/`lose`/`any`) | Battle ends |
| `onBattleAction` | `action` (`cardPlayed`/`attackUsed`/`cardRetired`/`turnEnded`) | In-battle action |
| `onStoryProgress` | `chapterId`, `battleId?` | Story progression |
| `onPackOpened` | `packType?` | Pack opened |
| `onAchievement` | `achievementId` | Achievement earned |
| `manual` | `id` | Explicitly triggered by code |

### Trigger Evaluation

When `checkTriggers(trigger)` is called:

1. Filter registered scenes where trigger matches and scene is not already completed
2. Evaluate scene conditions (required flags and progress thresholds)
3. Sort by priority (higher first)
4. Start the highest-priority eligible scene

Only one scene runs at a time. A running scene can only be preempted by one with strictly higher priority.

---

## SceneSpec — Scene Definition

```typescript
interface SceneSpec {
  id: string;
  version: number;
  title?: string;
  description?: string;
  triggers: SceneTrigger[];
  steps: SceneCommand[];
  backgroundImage?: string | number;
  music?: string;
  tags?: string[];
  priority?: number;
  conditions?: {
    flags?: Record<string, boolean>;
    progress?: Record<string, number>;
    minLevel?: number;
    maxLevel?: number;
  };
  locale?: string;
  localizedAssets?: Record<string, { backgroundImage?: string; music?: string }>;
}
```

---

## SceneManager Context

### Provider

`SceneManagerProvider` wraps the app and provides:

- Scene registration/unregistration
- Trigger evaluation
- Flag and progress state management
- Scene execution (renders `SceneRunner` as overlay)
- Persistence of tutorial progress

### Hooks

| Hook | Purpose |
|------|---------|
| `useSceneManager()` | Access the full `SceneManagerAPI` |
| `useSceneRegistration(scene)` | Register a scene on mount, unregister on unmount |
| `useSceneTrigger()` | Returns a function to fire triggers from components |
| `useSceneEvents()` | Returns a function to publish gameplay events (card_played, attack_used, etc.) |
| `useSceneDebug()` | Dev-only: list scenes, start scenes, inspect flags |

### User Events

Gameplay can publish domain events that the SceneManager translates to flags/progress:

| Event | Sets Flag | Updates Progress |
|-------|-----------|-----------------|
| `card_played` | `card_played = true` | `cards_in_play += 1` |
| `creature_selected` | `creature_selected = true` | — |
| `attack_used` | — | `attacks_used += 1` |
| `turn_ended` | `turn_ended = true` | — |

---

## Anchors System

### AnchorsContext

Provides a registry where UI components register named measurement points.

| Method | Description |
|--------|-------------|
| `register(id, measureFn)` | Register an anchor with a measurement function |
| `unregister(id)` | Remove an anchor |
| `getRect(id)` | Measure an anchor's position and size |
| `getAllAnchors()` | List all registered anchor IDs |

### Registration Hooks

| Hook | Usage |
|------|-------|
| `useAnchorRegister(id, ref, deps?)` | Register a React ref as an anchor |
| `useCustomAnchor(id, measureFn, deps?)` | Register with a custom measure function |
| `useMultipleAnchors(refs)` | Register multiple refs at once |

### Predefined Anchor IDs

```
openPackBtn, packInventory,
handArea, fieldArea, enemyField, endTurnBtn, energyDisplay, playerHp, enemyHp, turnStatus,
chapterNode, battleNode, nextChapterBtn,
cardGrid,
deckBuilderEntry, deckEditorInfo, deckEditorFilters, deckEditorGrid, deckEditorCurrentDeckBtn, deckEditorSaveBtn,
packShop, coinBalance
```

### Platform Measurement

- **Web**: Uses `getBoundingClientRect()` (viewport coordinates match `position: fixed` overlay)
- **Native**: Uses `UIManager.measure()` with `findNodeHandle()`

---

## SceneRunner — Execution

The SceneRunner renders as a full-screen overlay (`zIndex: 100000`) and executes commands sequentially via a program counter (`pc`).

### Execution Flow

1. Build labels map from scene steps
2. Execute command at current `pc`
3. Advance `pc` on completion (or jump via `goto`/`if`)
4. When `pc >= steps.length` → scene finished

### Highlight Retry

When a `highlight` command targets an anchor that isn't measured yet, the SceneRunner retries up to 30 times (every 200ms, ~6s total) before skipping.

### Animations

- Dialog: fade in/out (300ms/200ms)
- Portraits: spring animation (slideIn/slideOut)
- Background: optional fade transition
- Highlight: optional pulsate + glow effect

---

## ScenesRegistry

`ScenesRegistry` is a headless component mounted under the `SceneManagerProvider`. It:

1. Registers all tutorial scenes from `ALL_TUTORIAL_SCENES` on mount
2. Preloads critical scene assets via `sceneImageUtils.preloadCriticalAssets()`
3. Unregisters scenes on unmount

---

## Persistence

| Key | Storage | Data |
|-----|---------|------|
| `tutorial_progress_<userId>` | AsyncStorage | `TutorialProgress` JSON |

```typescript
interface TutorialProgress {
  flags: Record<string, boolean>;
  progress: Record<string, number>;
  completedScenes: string[];
  lastSeenAt: Record<string, number>;
  currentScene?: {
    sceneId: string;
    stepIndex: number;
    timestamp: number;
  };
}
```

Auto-saved whenever progress changes. Loaded once when auth is ready.

---

## Events

The SceneManager emits internal events:

| Event | When |
|-------|------|
| `scene_started` | Scene begins |
| `scene_finished` | Scene completes or is interrupted |
| `scene_step` | Each command executes |
| `flag_changed` | A flag value changes |
| `progress_changed` | A progress value changes |
| `choice_selected` | User picks a choice |
| `anchor_highlighted` | An anchor is highlighted |
| `user_input` | User taps dialog or highlight |

---

*Last updated: February 2026*
