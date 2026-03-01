# Tutorial System

> Technical documentation for the tutorial system in Creature Nexus TCG.
> Uses the Scene Engine to deliver interactive onboarding via anchor-based highlighting and visual novel dialogs.
> Introduced in v0.14.0 (October 2025), tutorial battle added in v0.15.0.

---

## Overview

The tutorial system guides new players through the app using auto-triggered interactive scenes. It relies on the Scene Engine (see [scene-engine.md](scene-engine.md)) for execution, and the Anchors system for highlighting UI elements. Tutorials are defined as `SceneSpec` objects and registered at app startup.

---

## Architecture

| File | Role |
|------|------|
| `data/scenes/tutorial-scenes.ts` | Tutorial scene definitions (`ALL_TUTORIAL_SCENES`) |
| `components/ScenesRegistry.tsx` | Registers all tutorial scenes on mount + preloads assets |
| `context/SceneManagerContext.tsx` | Orchestrates scene execution and persistence |
| `context/AnchorsContext.tsx` | UI anchor registration and measurement |
| `hooks/useAnchorPolling.ts` | Polls for anchor availability before triggering |
| `constants/tutorial.ts` | Polling defaults and timing constants |
| `components/SceneRunner.tsx` | Renders the scene overlay (dialogs, highlights) |

---

## How It Works

1. **Registration** — `ScenesRegistry` registers all `ALL_TUTORIAL_SCENES` on mount
2. **Anchor readiness** — Screens use `useAnchorPolling` to wait until key UI elements are measurable
3. **Triggering** — When anchors are ready, a `SceneTrigger` is fired (e.g., `onEnterScreen`)
4. **Execution** — `SceneManager` finds the matching scene, checks conditions, and starts the `SceneRunner`
5. **Completion** — Scene is marked completed and won't trigger again for that user

The SceneManager delays trigger processing until authentication is ready (`ready={!loading}` in `_layout`), preventing scenes from restarting on refresh.

---

## Auto-Triggering

Screens trigger tutorials automatically when their key anchors become measurable. Use the `useAnchorPolling` hook:

```tsx
import { useAnchorPolling } from '@/hooks/useAnchorPolling';
import { COMMON_ANCHORS } from '@/types/scenes';

function StoryModeScreen() {
  const sceneTrigger = useSceneTrigger();

  useAnchorPolling([
    COMMON_ANCHORS.CHAPTER_NODE,
  ], () => {
    sceneTrigger({ type: 'onEnterScreen', screen: 'story-mode' });
  });
}
```

### useAnchorPolling

```typescript
useAnchorPolling(
  anchorIds: string[],
  onReady: () => void,
  options?: {
    initialDelayMs?: number;   // default: 150
    intervalMs?: number;       // default: 100
    maxAttempts?: number;      // default: 12
  }
);
```

Runs on screen focus (`useFocusEffect`). Polls each anchor via `anchors.getRect()` and calls `onReady` when all anchors return valid rects.

### Polling Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `ANCHOR_POLL_INITIAL_DELAY_MS` | 150ms | Delay before first poll |
| `ANCHOR_POLL_INTERVAL_MS` | 100ms | Delay between retries |
| `ANCHOR_POLL_MAX_ATTEMPTS` | 12 | Max retries (~1.2s total) |
| `ANCHOR_POLL_LONG_ATTEMPTS` | 120 | Extended retries for slow screens (~12s) |

---

## Registering Anchors

To make a UI element targetable by tutorials, register it via `useAnchorRegister`:

```tsx
const buttonRef = useRef<TouchableOpacity | null>(null);
useAnchorRegister(COMMON_ANCHORS.DECK_BUILDER_ENTRY, buttonRef);

return (
  <TouchableOpacity ref={buttonRef}>
    {/* content */}
  </TouchableOpacity>
);
```

Once registered, scenes can reference the anchor ID in `highlight` commands. See [scene-engine.md](scene-engine.md) for the full list of predefined anchor IDs.

---

## Manual Replay

Every screen exposes a `HelpCircle` button that allows players to replay the tutorial manually:

```tsx
<TouchableOpacity
  onPress={() => {
    try {
      sceneManager.resetSceneHistory('tutorial_collection_intro');
      sceneManager.startScene('tutorial_collection_intro');
    } catch (error) {
      if (__DEV__) console.warn('[Tutorial] Failed to start scene', error);
    }
  }}
>
  <HelpCircle size={20} color={Colors.text.primary} />
</TouchableOpacity>
```

---

## Persistence

| Key | Storage | Data |
|-----|---------|------|
| `tutorial_progress_<userId>` | AsyncStorage | `TutorialProgress` JSON |

Progress includes completed scene IDs, flags, numeric progress counters, and timestamps. Auto-saved on every change. See [scene-engine.md](scene-engine.md) for the full `TutorialProgress` interface.

---

## Adding a New Tutorial

1. Create the scene in `data/scenes/tutorial-scenes.ts` and add it to `ALL_TUTORIAL_SCENES`
2. Register anchor(s) in the target component with `useAnchorRegister`
3. Auto-trigger the scene via `useAnchorPolling([...], () => sceneTrigger(...))`
4. Expose a `HelpCircle` button for manual replay
5. Localize all dialog text (use `i18n:` prefix in scene commands)

---

*Last updated: February 2026*
