# Battlefield Visual System

> Technical documentation for the battlefield themes and particle effects in Creature Nexus TCG.
> Themes added in v0.16.0, particle effects in v0.18.0.

---

## Overview

The battlefield visual system provides themed arenas for card battles. Each theme defines colors, gradients, borders, and optional animated particle effects. Themes are assigned per player field (top/bottom).

---

## Themes

### Available Themes

| ID (`themeId`) | Name | Style | Particle Effects |
|----------------|------|-------|-----------------|
| `default` | Classic Arena | Neutral palette, semi-transparent background | None |
| `fire_temple` | Fire Temple | Red/orange lava gradient | `sparks` (density 15, color `#FF6347`) |
| `water_shrine` | Water Shrine | Blue aquatic gradient | `floating` (density 10, color `#87CEEB`) |
| `earth_cavern` | Earth Cavern | Green/mineral gradient | None |
| `air_peaks` | Sky Peaks | Light blue cloud gradient | `floating` (density 8, color `#F0F8FF`) |

### Theme Properties

Each theme can define:

| Property | Description |
|----------|-------------|
| `backgroundGradient` | Gradient colors for the field background |
| `fieldBackgroundColor` | Solid background color |
| `fieldBorderColor` | Border color |
| `fieldBorderWidth` | Border width |
| `fieldBorderRadius` | Border radius |
| `particleEffects` | Animated particle configuration (see below) |
| `backgroundImage` | Background image (placeholder, not used yet) |
| `cardSpacing` / `cardElevation` | Suggested card layout adjustments |
| `ambientSound` / `actionSounds` | Audio placeholders (not used yet) |

All properties are optional. Always provide a fallback to `default` for unknown theme IDs.

### Loading and Selection

Themes are exported via `BATTLEFIELD_THEMES` from `types/battlefield.ts`:

```typescript
import { BATTLEFIELD_THEMES } from '@/types/battlefield';

function getThemeById(themeId: string) {
  return BATTLEFIELD_THEMES.find((theme) => theme.id === themeId) ?? BATTLEFIELD_THEMES[0];
}
```

### Usage in UI

In `GameBoard`, themes are assigned per player field via `BattlefieldConfig`:

```typescript
const config: BattlefieldConfig = {
  playerFields: [
    { playerId: human.id, themeId: 'water_shrine', position: 'bottom' },
    { playerId: ai.id, themeId: 'fire_temple', position: 'top' },
  ],
};
```

Then passed to the `Battlefield` component:

```tsx
const theme = getThemeById(fieldConfig?.themeId ?? 'default');

<Battlefield
  label={`${playerAtTop.name} Field`}
  cards={playerAtTop.field}
  theme={theme}
  position="top"
/>
```

---

## Particle Effects

### Architecture

| File | Role |
|------|------|
| `types/battlefield.ts` | Particle effect type definitions and theme data |
| `components/board/BattlefieldParticles.tsx` | Centralized particle renderer |
| `components/board/Battlefield.tsx` | Hosts the particle container (`particleEffects` block) |

The `BattlefieldParticles` component is already wired into `Battlefield.tsx`. To enable particles for a theme, define the `particleEffects` property in the theme data.

### Effect Types

| Type | Description |
|------|-------------|
| `floating` | Small orbs rising slowly with horizontal drift and pulsing opacity |
| `sparks` | Fast bursts, short scale + fade, random respawn |
| `smoke` | Soft clouds (gradient/blur) dissipating slowly |
| `energy` | Rotating orbs/arcs with color pulsation |

### Implementation (Reanimated)

Particles use `react-native-reanimated` with shared values, `withRepeat`, and `withTiming`.

To add a new effect type:
1. Follow the `{Type}Layer` + `generate{Type}Particles` pattern
2. Add the type to `types/battlefield.ts`
3. Provide a basic `Animated` fallback for Web if worklets are unavailable

### Performance

- Positions and delays are generated via `useMemo` (stable while theme unchanged)
- Density is capped: `Math.min(effect.density, 20)` for mobile performance
- `pointerEvents="none"` on the particle container prevents blocking UI interactions
- Consider a `shouldReduceMotion` flag for accessibility

---

## Adding a New Theme

1. Define the theme object in `types/battlefield.ts` with a unique `id`
2. Add it to the `BATTLEFIELD_THEMES` array
3. Configure `particleEffects` if animated effects are desired
4. Preview in the theme visualizer: Profile → "Arena Laboratory" (`/battlefield-theme-test`)
5. Verify rendering on iOS/Android/Web
6. Always fall back to `default` for unknown theme IDs:
   ```typescript
   const theme = getThemeById(themeId ?? 'default');
   ```

---

## Testing

- Use the **Arena Laboratory** page (`/battlefield-theme-test`, accessible from Profile) to preview all themes, particles, and metadata
- The preview renders `Battlefield` at reduced size (`cardSize="small"`)
- Validate new themes in this page before wiring them into `GameBoard` or tutorial scenes
- Profile performance on mobile — no snapshot tests, prefer manual visual validation
- Run `npm run lint` after changes

---

## i18n Keys

| Key | EN | FR |
|-----|----|----|
| `profile.battlefieldThemeLab` | Battlefield Theme Lab | Laboratoire des arènes |
| `profile.battlefieldThemeLabSubtitle` | Preview arena styles, animations, and layout variations. | Prévisualisez les styles d'arène, les particules et les variations UI. |
| `profile.availableThemes` | Available Themes | Thèmes disponibles |
| `profile.themePreviewTitle` | Visual Preview | Aperçu visuel |
| `profile.themeConfigTitle` | Theme Configuration | Configuration du thème |
| `profile.themeId` | Theme ID | ID du thème |
| `profile.fieldBorder` | Field Border | Bordure du terrain |
| `profile.fieldBackground` | Field Background | Fond du terrain |
| `profile.cardSpacing` | Card Spacing | Espacement des cartes |
| `profile.particleEffects` | Particle Effects | Effets de particules |
| `profile.autoValue` | auto | auto |
| `profile.noneValue` | None | Aucun |

---

*Last updated: February 2026*
