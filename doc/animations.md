# Animations

> Technical documentation for the animation components in Creature Nexus TCG.
> Various components added from v0.2.0 to v0.9.0.

---

## Overview

The app uses a set of specialized animation components for game feedback, card reveals, and visual effects. Combat effects use Reanimated 3 + Skia (lazy-loaded overlays); pack/reward animations use the legacy `Animated` API.

---

## Components

### PackOpeningAnimation

| | |
|---|---|
| **File** | `components/Animation/PackOpeningAnimation.tsx` |
| **Library** | `react-native-reanimated` |
| **Used in** | Store screen, Home screen |

Displays opened cards in a modal with a 3-2 grid layout. Cards animate in sequentially with spring effects. Supports multi-pack pagination (5 cards per page).

| Prop | Type | Description |
|------|------|-------------|
| `cards` | `Card[]` | Cards to display |
| `onComplete` | `() => void` | Called when animation finishes |

---

### RewardAnimation

| | |
|---|---|
| **File** | `components/Animation/RewardAnimation.tsx` |
| **Library** | `Animated` |
| **Used in** | `RedeemCodeModal` |

Centered popup that displays a reward (card, pack, or coins) with scale-up + fade-in, hold, then fade-out.

| Prop | Type | Description |
|------|------|-------------|
| `type` | `'card'` \| `'pack'` \| `'coins'` | Reward type |
| `message` | `string` | Text above the visual |
| `card?` | `Card` | Card to display (when type = card) |
| `pack?` | `BoosterPack` | Pack to display (when type = pack) |
| `coins?` | `number` | Coin amount (when type = coins) |
| `onComplete?` | `() => void` | Called when animation finishes |
| `durationMs?` | `number` | Total duration (default: 1600ms) |

---

### DamageEffect

| | |
|---|---|
| **File** | `components/DamageEffect.tsx` |
| **Library** | Reanimated 3 + Skia (lazy-loaded overlays) |
| **Used in** | `CardComponent` (wraps attacked cards) |

Wraps a child component with hitstop freeze, horizontal shake, Skia flash overlay with particles, and floating damage number. On lethal hits, adds a death dissolve sequence (scale shrink + rotation + Skia dissolution overlay).

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Component to wrap |
| `isActive` | `boolean` | Trigger the animation |
| `duration?` | `number` | Duration in ms (default: 1000, 0 to disable) |
| `damage?` | `number` | Damage value to display |
| `isLethal?` | `boolean` | Triggers death dissolve animation |
| `attackElement?` | `Element` | Element for color theming (fire/water/earth/air) |
| `onAnimationComplete?` | `() => void` | Called when animation finishes |

Animation sequence (non-lethal): hitstop → Skia flash + particles + shake + attack effect → damage number float.
Animation sequence (lethal): hitstop → Skia flash + particles + shake + attack effect → death dissolve (scale 1→0.8 + rotate 0→8° + Skia dissolution overlay + fade out).

Lazy-loaded Skia overlays: `SkiaFlashOverlay`, `AttackEffectSprite`, `SkiaDeathOverlay` (in render order).

---

### SkiaSelectionGlow

| | |
|---|---|
| **File** | `components/Animation/SkiaSelectionGlow.tsx` |
| **Library** | Skia + Reanimated 3 |
| **Used in** | `CardComponent` (lazy-loaded) |

Pulsating glow border rendered behind the card using a Skia Canvas with a blurred stroke. Toggled via `USE_SKIA_GLOW` flag in `constants/animation.ts`. When disabled, falls back to CSS boxShadow styles.

| Prop | Type | Description |
|------|------|-------------|
| `color` | `string` | Glow color |
| `isActive` | `boolean` | Show/hide the glow |
| `borderRadius?` | `number` | Card border radius (default: 8) |

---

### AttackEffectSprite

| | |
|---|---|
| **File** | `components/Animation/AttackEffectSprite.tsx` |
| **Library** | Skia (native) / Reanimated AnimatedImage (web) |
| **Used in** | `DamageEffect` (lazy-loaded) |

Platform dispatcher for element-based attack spritesheet animations. Returns `null` if no spritesheet is registered for the given element (falls back to the procedural `SkiaAttackEffect`).

Routing: `Platform.OS === 'web'` → `WebSpritesheetAttack`, otherwise → `SkiaSpritesheetAttack`.

| Prop | Type | Description |
|------|------|-------------|
| `progress` | `SharedValue<number>` | Animation progress 0→1 |
| `attackElement?` | `Element` | Element for spritesheet selection |

Asset registry: `components/Animation/attackSprites.ts` — maps `fire`, `water`, `air`, `earth` to their PNG assets (`Fire.png`, `Water.png`, `Wind.png`, `Earth.png` in `assets/images/attack/`, 5 columns, square frames assumed). Use `hasSpritesheet(element)` to check availability.

**Native** (`SkiaSpritesheetAttack`): Skia `Canvas` with a `Group` clip rect. The full spritesheet is translated to bring the current frame into view.

**Web** (`WebSpritesheetAttack`): `AnimatedImage` scaled so one frame fills the container, then translated by `col × containerWidth` / `row × containerHeight`.

> **Constraint:** `numRows` is derived from `image.height / frameWidth`, which assumes square frames. Document this when adding new spritesheets.

---

### SkiaDeathOverlay

| | |
|---|---|
| **File** | `components/Animation/SkiaDeathOverlay.tsx` |
| **Library** | Skia + Reanimated 3 |
| **Used in** | `DamageEffect` (lazy-loaded, lethal hits only) |

Element-themed dissolution overlay with growing dissolve circles and flying debris particles. Each particle is a sub-component (`DissolveCircle`, `DebrisCircle`) to respect React hooks rules with `useDerivedValue`.

| Prop | Type | Description |
|------|------|-------------|
| `progress` | `SharedValue<number>` | Animation progress 0→1 |
| `attackElement?` | `Element` | Element for color theming |

---

### SpellCastAnimation

| | |
|---|---|
| **File** | `components/Animation/SpellCastAnimation.tsx` |
| **Library** | `Animated` |
| **Used in** | `GameBoard` |

A spell card flies from its starting position to center screen, pulses, then fades out. A purple magic wave expands from the center simultaneously.

| Prop | Type | Description |
|------|------|-------------|
| `spell` | `Card` | The spell card to animate |
| `startPosition` | `{ x, y }` | Starting coordinates |
| `onComplete?` | `() => void` | Called when animation finishes |

---

### EnergyWaveAnimation

| | |
|---|---|
| **File** | `components/Animation/EnergyWaveAnimation.tsx` |
| **Library** | `Animated` |
| **Used in** | Energy gain phase |

A radiating green/cyan expanding circle with a bouncy text label showing energy gain amount.

| Prop | Type | Description |
|------|------|-------------|
| `energyAmount` | `number` | Energy amount to display |
| `onComplete?` | `() => void` | Called when animation finishes |

---

### EnergyOrbAnimation

| | |
|---|---|
| **File** | `components/Animation/EnergyOrbAnimation.tsx` |
| **Library** | `Animated` |
| **Used in** | Energy gain effects |

A glowing purple orb that floats from a start position to a target position, displaying the energy amount, then disappears with a burst effect.

| Prop | Type | Description |
|------|------|-------------|
| `energyAmount` | `number` | Energy amount to display |
| `onComplete?` | `() => void` | Called when animation finishes |
| `targetPosition?` | `{ x, y }` | Target coordinates (default: top-left) |
| `startPosition?` | `{ x, y }` | Start coordinates (default: bottom-center) |

---

### MonsterShowcaseAnimation

| | |
|---|---|
| **File** | `components/Animation/MonsterShowcaseAnimation.tsx` |
| **Library** | `Animated` |
| **Used in** | Auth/login screen |

Flipbook-style animation that cycles through monster images with increasing speed, ending with a final mythic reveal. Platform-specific image sets (web vs mobile).

| Prop | Type | Description |
|------|------|-------------|
| `transitionDuration?` | `number` | Time per image (default: 800ms) |
| `fadeDuration?` | `number` | Fade transition time (default: 400ms) |
| `autoStart?` | `boolean` | Auto-start on mount (default: true) |
| `fullScreen?` | `boolean` | Full-screen overlay mode (default: false) |
| `onAnimationComplete?` | `() => void` | Called when complete |
| `onSkip?` | `() => void` | Called when skip button pressed |

---

### EnergyAnimationDemo

| | |
|---|---|
| **File** | `components/Animation/EnergyAnimationDemo.tsx` |
| **Used in** | Dev/test only |

Test harness for previewing all animation components: energy, spells, rewards, damage (normal/lethal per element), card entry, card retire, and selection glow.

---

## Summary

| Component | Effect | Library | Trigger |
|-----------|--------|---------|---------|
| PackOpeningAnimation | Card grid reveal with pagination | Reanimated | Pack opened |
| RewardAnimation | Centered popup (scale + fade) | Animated | Promo code redeemed |
| DamageEffect | Skia flash + shake + attack effect + death dissolve | Reanimated + Skia | Card takes damage |
| AttackEffectSprite | Element spritesheet (fire/water/air/earth) or procedural fallback | Skia / AnimatedImage | During damage animation |
| SkiaSelectionGlow | Pulsating glow border | Skia + Reanimated | Card selected/targeted |
| SkiaDeathOverlay | Element-themed dissolution | Skia + Reanimated | Lethal hit |
| SpellCastAnimation | Card flies to center + magic wave | Animated | Spell cast |
| EnergyWaveAnimation | Expanding circle + text | Animated | Energy gained |
| EnergyOrbAnimation | Floating orb trajectory | Animated | Energy gained |
| MonsterShowcaseAnimation | Flipbook creature reveal | Animated | Login screen |
| TurnTransitionBanner | Slide in/out turn banner | Reanimated | Turn change |
| GameOverAnimation | Victory/defeat with bounce + staggered fade-in | Reanimated | Game over |
| useScreenShake | Screen shake on impacts | Reanimated | Damage dealt |

---

## Animation Queue

| | |
|---|---|
| **File** | `utils/game/animationQueue.ts` |
| **Used in** | `context/GameContext.tsx` |

Centralized sequential queue for turn-transition animations. Prevents overlapping animations (e.g. energy wave starting before AI damage finishes).

**API**: `enqueue(item)`, `prepend(item)`, `flush()`, `clear()`, with `onPlay`/`onComplete` callbacks dispatching to the GameContext reducer.

### Which animations go through the queue?

| Animation | Via queue? | Reason |
|-----------|-----------|--------|
| Turn Banner (AI→player) | **Yes** | Prepended before energy wave via `prepend()` |
| EnergyWave (player turn start) | **Yes** | Must wait for AI turn animations to finish |
| DamageEffect (AI attack) | No | Already sequenced by `await delay()` in `executeAITurn` |
| DamageEffect (player attack) | No | Triggered by user interaction, no conflict |
| SpellCast (AI) | No | Already sequenced by `await delay(SPELL_CAST_ENGINE_DELAY_MS)` |
| SpellCast (player) | No | Triggered by user interaction |
| Turn Banner (player→AI) | No | Triggered directly via local state in GameBoard |
| Game Over (future) | **Yes** | Should wait for all animations to finish |

---

## Animation Constants

All timing constants are centralized in `constants/animation.ts`:

| Constant | Value | Description |
|----------|-------|-------------|
| `KILL_ANIM_MS` | 1200ms | Lethal hit: shake → dissolution → fade |
| `NON_KILL_ANIM_MS` | 1000ms | Non-lethal hit feedback |
| `ATTACK_EFFECT_DURATION_MS` | 480ms | Spritesheet / procedural attack effect duration |
| `HITSTOP_DURATION_MS` | 80ms | Freeze frame before impact |
| `CARD_ENTRY_DURATION_MS` | 350ms | Card appears on field (scale + opacity) |
| `CARD_DEATH_DURATION_MS` | 600ms | Death dissolve/shrink |
| `CARD_RETIRE_DURATION_MS` | 400ms | Card retire fade + slide |
| `DAMAGE_NUMBER_DURATION_MS` | 900ms | Floating damage number |
| `ENERGY_WAVE_DURATION_MS` | 1500ms | Energy wave at turn transition |
| `TURN_TRANSITION_DURATION_MS` | 2000ms | Turn banner animation |
| `SPELL_CAST_ENGINE_DELAY_MS` | 1200ms | Delay before spell effect |
| `USE_SKIA_GLOW` | true | Feature flag: Skia glow vs CSS boxShadow |

---

*Last updated: February 2026*
