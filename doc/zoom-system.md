# Zoom System

> Technical documentation for the configurable zoom system in Creature Nexus TCG.
> Implemented in v0.19.0 (January 22, 2026).

---

## Overview

The zoom system is a two-tier, platform-aware scaling mechanism that adjusts the UI for different screen sizes. It uses React Native's `transform: scale` with dimension compensation to maintain proper layout.

### Features

- **Global zoom**: Scales the entire application
- **GameBoard zoom**: Independent zoom for the battle screen only
- Platform-aware: Android (always) + Web responsive mode (< 768px)
- Configurable via environment variables
- No external library required

---

## Configuration

### Environment Variables (`.env`)

```env
EXPO_PUBLIC_ZOOM_SCALE=0.75
EXPO_PUBLIC_GAMEBOARD_ZOOM_SCALE=0.60
```

| Variable | Target | Default | Description |
|----------|--------|---------|-------------|
| `EXPO_PUBLIC_ZOOM_SCALE` | Entire app | `1` (no zoom) | Global UI scale |
| `EXPO_PUBLIC_GAMEBOARD_ZOOM_SCALE` | Battle screen | `0.75` | GameBoard scale |

- Recommended range: `0.5` to `1.0`
- `1.0` = no zoom (normal size)
- Lower values = more content visible but smaller
- Requires Expo server restart after change

---

## Architecture

### Files

| File | Role |
|------|------|
| `.env` / `.env.sample` | Zoom scale values |
| `app/_layout.tsx` | `ZoomWrapper` component (global zoom) |
| `components/GameBoard.tsx` | GameBoard-specific zoom with relative calculation |

### Platform Behavior

| Platform | Condition | Zoom Applied |
|----------|-----------|--------------|
| Android | Always | Yes |
| Web < 768px | Responsive mobile mode | Yes |
| Web >= 768px | Tablet/desktop | No |
| iOS | Always | No |

---

## Implementation

### Global Zoom (`app/_layout.tsx`)

The `ZoomWrapper` component wraps the entire navigation `Stack`:

```typescript
const ZoomWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useWindowDimensions();
  const zoomScale = parseFloat(process.env.EXPO_PUBLIC_ZOOM_SCALE || '1');
  const shouldZoom = Platform.OS === 'android' || (Platform.OS === 'web' && width < 768);

  const compensatedWidth = width / zoomScale;
  const compensatedHeight = height / zoomScale;

  const dynamicZoomStyle: ViewStyle = {
    width: compensatedWidth,
    height: compensatedHeight,
    transform: [{ scale: zoomScale }],
    transformOrigin: 'top left',
  };

  return (
    <View style={shouldZoom ? dynamicZoomStyle : styles.noZoomContainer}>
      {children}
    </View>
  );
};
```

Usage in layout:

```tsx
<ZoomWrapper>
  <Stack screenOptions={{ ... }}>
    {/* All screens */}
  </Stack>
  <StatusBar style="light" hidden={Platform.OS === 'android'} />
</ZoomWrapper>
```

### GameBoard Zoom (`components/GameBoard.tsx`)

The GameBoard applies its own zoom **relative to the parent's zoom** to achieve the desired absolute scale:

```typescript
const globalZoomScale = parseFloat(process.env.EXPO_PUBLIC_ZOOM_SCALE || '1');
const gameboardZoomScale = parseFloat(process.env.EXPO_PUBLIC_GAMEBOARD_ZOOM_SCALE || '0.75');

// Relative zoom: compensate for parent's already-applied global zoom
const relativeZoom = gameboardZoomScale / globalZoomScale;

const compensatedWidth = shouldZoom ? (width / gameboardZoomScale) : width;
const compensatedHeight = shouldZoom ? (height / gameboardZoomScale) : height;
const zoomTransform = shouldZoom ? [{ scale: relativeZoom }] : undefined;
```

**Example**: With `globalZoomScale = 0.75` and `gameboardZoomScale = 0.60`:
- `relativeZoom = 0.60 / 0.75 = 0.8`
- Parent already scales to 75%, GameBoard then scales to 80% of that = **60% overall**

The wrapper style is applied around the `mainContainer`:

```tsx
<View style={zoomWrapperStyle}>
  <View style={styles.mainContainer}>
    {/* GameBoard content */}
  </View>
</View>
```

---

## Technical Details

### Dimension Compensation

Without compensation, scaling shrinks the content and creates empty space. The formula inflates dimensions before scaling so the result fills the screen:

```
Compensated Dimension = Screen Dimension / Zoom Scale

Example (zoom 0.75, screen 1000px wide):
  Compensated = 1000 / 0.75 = 1333px
  After scale: 1333 × 0.75 = 1000px  (fills the screen)
```

### Transform Origin

`transformOrigin: 'top left'` is required:
- **Without**: Content scales from center, leaving empty space around edges
- **With**: Content scales from the top-left corner, filling the viewport correctly

### Independence from Other Systems

- Zoom is **not user-configurable at runtime** — it's a deployment-time setting
- Card size preference (`small` / `normal` in `SettingsContext`) is a separate system
- Component-level animations (Reanimated) work independently of the zoom transform
- The 768px responsive breakpoint is shared with other layout components (`StatusBar`, store screen)

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Zoom not applied | Wrong platform or screen > 768px | Check platform and resize browser below 768px |
| Zoom not applied after `.env` change | Expo cache | Restart Expo server (`Ctrl+C` then `npm run dev`) |
| Scrollbar or overflow | Missing `transformOrigin` | Ensure `transformOrigin: 'top left'` is set |
| Empty space at bottom/right | Zoom value too low | Increase zoom (e.g. `0.75` → `0.8`) |
| GameBoard zoom incorrect | Relative calculation issue | Verify both env variables are set correctly |

---

*Last updated: February 2026*
