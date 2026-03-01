# Avatar System

> Technical documentation for the player avatar system in Creature Nexus TCG.
> Implemented in v0.20.0 (January 24, 2026), extended in v0.21.0 (avatars in battle).

---

## Overview

The avatar system allows players to select a common-rarity creature as their visual representation. The avatar is displayed on the profile screen and in player info during battles.

### Features

- Selection from 5 predefined creatures + default avatar
- Circular display with element-colored border
- Can be changed at any time via selection modal
- Firebase Firestore synchronization
- Offline cache via AsyncStorage
- i18n support (FR/EN)

---

## Architecture

### Files

| File | Role |
|------|------|
| `types/avatar.ts` | TypeScript types (`AvailableAvatar`, `AvatarCreature`) |
| `utils/avatarUtils.ts` | Data and utility functions |
| `components/PlayerAvatar.tsx` | Circular display component |
| `components/AvatarSelector.tsx` | Selection modal |
| `context/AuthContext.tsx` | State management and persistence |
| `app/(tabs)/profile.tsx` | Profile page integration |
| `components/GameBoard.tsx` | Passes avatar to PlayerInfo |
| `components/board/PlayerInfo.tsx` | Battle display |

### Available Avatars

| Creature | Element | Image | Border Color |
|----------|---------|-------|--------------|
| Flareen | Fire | `assets/images/common/Flareen_avatar.png` | `#FF6B6B` |
| Cryil | Water | `assets/images/common/Cryil.png` | `#4ECDC4` |
| Barkyn | Earth | `assets/images/common/Barkyn.png` | `#D4A574` |
| Lumen | Earth | `assets/images/common/Lumen_avatar.png` | `#D4A574` |
| Ventun | Air | `assets/images/common/Ventun.png` | `#95E1D3` |
| *(default)* | — | `assets/images/common/common_generic.png` | `#777777` |

---

## Components

### PlayerAvatar

Reusable component to display a circular avatar with an element-colored border.

```tsx
<PlayerAvatar
  creatureName="Flareen"  // string | null
  size="large"            // 'small' (60px) | 'medium' (100px) | 'large' (140px)
  showBorder={true}       // element-colored border
/>
```

- `creatureName: null` displays the generic default avatar
- Border color is determined by `getElementColor(element)`
- Shadow/elevation for depth effect

### AvatarSelector

Selection modal following the project's `RedeemCodeModal` pattern.

```tsx
<AvatarSelector
  visible={showAvatarSelector}
  currentAvatar={avatarCreature}
  onClose={() => setShowAvatarSelector(false)}
  onSelect={handleAvatarSelect}
/>
```

- Responsive grid showing all 6 options (default + 5 creatures)
- Temporary selection with required confirmation
- Cancel / Confirm buttons

---

## State Management

### AuthContext

The avatar is managed within `AuthContext` alongside authentication:

```typescript
// Properties exposed by the context
avatarCreature: string | null;
updateAvatar: (creatureName: string | null) => Promise<void>;
```

### Data Flow

```
Selection in AvatarSelector
  → handleAvatarSelect(creatureName)
    → updateAvatar(creatureName) [AuthContext]
      → updateDoc Firebase (users/{uid}.avatarCreature)
      → setAvatarCreature (local state)
      → AsyncStorage.setItem (offline cache)
    → Success/error alert
```

### Initialization

1. `onAuthStateChanged` loads the Firestore document `users/{uid}`
2. Extracts `avatarCreature` (null if undefined or new account)
3. Updates local state via `setAvatarCreature`
4. Saves to AsyncStorage (`avatar_{uid}`)

---

## Persistence

### Firebase Firestore

```
Collection: users/{uid}
Field: avatarCreature (string | null)
```

- Account creation: `avatarCreature: null`
- Automatic migration: existing accounts without the field receive `null`

### AsyncStorage

```
Key: avatar_{userId}
Value: creature name or 'default'
```

Used for offline display when Firestore is unavailable.

---

## Integrations

### Profile Page (`app/(tabs)/profile.tsx`)

- Avatar displayed large (size `large`) at the top of the page
- "Change Avatar" button opens the `AvatarSelector` modal
- Feedback via success/error alerts

### Battle (`components/board/PlayerInfo.tsx`)

- Avatar displayed small (size `small`) next to name and stats
- `avatarCreature` prop passed from `GameBoard.tsx`
- Left/right positioning support (`avatarPosition`)

---

## i18n

### Keys

| Key | EN | FR |
|-----|----|----|
| `avatar.changeAvatar` | Change Avatar | Changer d'avatar |
| `avatar.selectAvatar` | Select your avatar | Sélectionnez votre avatar |
| `avatar.selectAvatarDesc` | Choose a creature to represent you | Choisissez une créature pour vous représenter |
| `avatar.defaultAvatar` | Default | Par défaut |
| `avatar.avatarUpdated` | Avatar updated successfully! | Avatar mis à jour avec succès ! |
| `avatar.title` | Avatar | Avatar |
| `avatar.avatarUpdateFailed` | Failed to update avatar. Please try again. | Échec de la mise à jour de l'avatar. Veuillez réessayer. |

---

## Adding a New Avatar

1. Add the image to `assets/images/common/`
2. Add the entry to `AVAILABLE_AVATARS` in `utils/avatarUtils.ts`:
   ```typescript
   { name: 'CreatureName', element: 'fire' }
   ```
3. Add the image mapping in `getAvatarImage()` in `utils/avatarUtils.ts`:
   ```typescript
   CreatureName: require('@/assets/images/common/CreatureName.png'),
   ```
4. Verify with `npm run i18n:check`

---

## Possible Future Extensions

- Premium avatars unlocked through purchases or achievements
- Animations (glow effect, element-based particles)
- Avatar visible in a future leaderboard or PvP mode
- Customizable borders and badges

---

*Last updated: February 2026*
