# Demo Mode (Offline / itch.io)

> Standalone demo mode that runs without Firebase, using AsyncStorage for local persistence.

## Overview

Demo mode allows Creature Nexus TCG to run as a self-contained web application without any Firebase dependency. This is primarily used for the **itch.io** distribution, where the game runs inside an iframe with no backend.

When `EXPO_PUBLIC_DEMO_MODE=true`, the app:
- Creates an automatic guest user on first launch
- Stores all data locally via AsyncStorage
- Disables authentication flows (email, Google)
- Disables promo code redemption
- Disables story mode (temporarily)
- Shows a Discord CTA after battles for community feedback

## Architecture

### Conditional Provider Loading

The core mechanism is a **conditional `require()` pattern** in `context/Providers.tsx`. At startup, the app checks `isDemoMode` and loads either Local or Firebase implementations:

```
context/Providers.tsx
  ├── isDemoMode === true  → AuthContextLocal + DeckContextLocal + StoryModeContextLocal
  └── isDemoMode === false → AuthContextFirebase + DeckContextFirebase + StoryModeContextFirebase
```

This uses `require()` (not static `import`) to prevent the bundler from including Firebase code in demo builds.

### File Structure

```
config/
  └── localMode.ts              # isDemoMode flag + DEMO_CONFIG constants

context/
  ├── Providers.tsx             # Conditional provider loader (entry point)
  ├── AuthContextLocal.tsx      # Local auth (guest auto-login, coins, cards, packs)
  ├── AuthContextFirebase.tsx   # Firebase auth (renamed from AuthContext.tsx)
  ├── DeckContextLocal.tsx      # Local deck CRUD via AsyncStorage
  ├── DeckContextFirebase.tsx   # Firebase deck sync (renamed from DeckContext.tsx)
  ├── StoryModeContextLocal.tsx # Local story progression
  └── StoryModeContextFirebase.tsx # Firebase story sync (renamed from StoryModeContext.tsx)

utils/
  └── localStorageUtils.ts      # Centralized AsyncStorage helpers for demo data

scripts/
  └── fix-web-build.js          # Post-build script for itch.io compatibility
```

### Context Interface Parity

Each Local context exports the **same interface** as its Firebase counterpart (`AuthProvider`, `useAuth`, `DeckProvider`, `useDecks`, `StoryModeProvider`, `useStoryMode`). This means all consuming components work identically in both modes without any code changes.

## Configuration

### Environment Variable

```bash
EXPO_PUBLIC_DEMO_MODE=true   # Enable demo mode
```

### Demo Config (`config/localMode.ts`)

| Parameter | Value | Description |
|-----------|-------|-------------|
| `startingCoins` | 100 | Initial Nexus Coins for new demo users |
| `startingPacks` | 2 | Number of Standard packs given at start |
| `demoUserUidPrefix` | `demo_user_` | UID prefix for demo users |

### Starter Data

On first launch, `initializeDemoUser()` creates:
- A guest user profile with a random pseudo
- 100 Nexus Coins
- 10 starter cards (randomly generated)
- 2 Standard packs in inventory
- Empty deck list

## AsyncStorage Schema

All demo data uses the `@demo_` prefix to avoid conflicts with any production data.

| Key | Type | Content |
|-----|------|---------|
| `@demo_user` | `DemoUserProfile` | User profile (uid, pseudo, avatar, etc.) |
| `@demo_coins` | `number` (string) | Nexus Coins balance |
| `@demo_cards` | `Card[]` | Card collection |
| `@demo_packs` | `InventoryPack[]` | Unopened pack inventory |
| `@demo_decks` | `SavedDeck[]` | Saved decks |
| `@demo_active_deck` | `string` | Active deck ID |
| `@demo_story_progress` | `StoryProgressLight` | Story mode progression |
| `@demo_last_free_pack` | `number` (string) | Timestamp of last free pack claim |

All helpers are centralized in `utils/localStorageUtils.ts`.

## Feature Comparison

| Feature | Firebase Mode | Demo Mode |
|---------|--------------|-----------|
| Email/Google login | Yes | No (throws error) |
| Auto guest user | Yes | Yes |
| Card collection | Cloud (Firestore) | Local (AsyncStorage) |
| Deck management | Cloud + real-time sync | Local |
| Story progression | Cloud + local cache | Local only |
| Nexus Coins economy | Cloud | Local |
| Pack opening | Yes | Yes |
| Free daily pack | Yes | Yes |
| Quick battle | Yes | Yes |
| Battle tutorial | Yes | Yes |
| Story mode | Yes | No (hidden in demo) |
| Promo codes | Yes | No (disabled) |
| Multi-device sync | Yes | No |
| Push notifications | Yes | No |
| In-app purchases | Yes | No |

## Discord CTA

In demo mode, a **Discord call-to-action** is displayed on the game-over screen in `GameBoard.tsx`. It invites players to join the community and provide feedback. The CTA only appears when `isDemoMode` is true and a `DISCORD_INVITE_URL` is configured in the component.

## itch.io Web Export

### Build Process

```bash
# 1. Build the web export in demo mode
EXPO_PUBLIC_DEMO_MODE=true npx expo export --platform web

# 2. Run the post-build patch script
node scripts/fix-web-build.js

# 3. Upload the dist/ folder to itch.io as an HTML5 game
```

### Post-Build Script (`scripts/fix-web-build.js`)

Expo's default web export assumes deployment at a domain root with server-side routing. The `fix-web-build.js` script patches the output for iframe/static hosting:

1. **Materializes route directories** — Converts flat `route.html` files into `route/index.html` structure
2. **Rewrites asset paths** — Makes all `/_expo/`, `/assets/`, and favicon references relative
3. **Injects `<base>` tag** — Ensures relative path resolution in nested routes
4. **Patches the Expo entry bundle** — Rewrites `buildUrlForBundle` to use `__EXPO_BASE_URL` instead of absolute `/` paths
5. **Injects route handling scripts**:
   - `__EXPO_BASE_URL` — Dynamic base URL calculation
   - `__EXPO_CUSTOM_LOCATION` — Route override via `sessionStorage` for sub-route navigation
   - History API patches — Prefixes `pushState`/`replaceState` URLs with the base path
   - Redirect scripts — Sub-route HTML files redirect to root `index.html` with the target route stored in `sessionStorage`

## Disabled Features in Demo

- **Story Mode** — Hidden from the battle menu (`battle.tsx` checks `isDemoMode`)
- **Authentication** — Email/Google sign-in methods throw errors; only guest mode works
- **Promo Codes** — Redemption is disabled
- **Cloud Sync** — `syncDecks()` is a no-op; no Firestore listeners
- **Notifications** — Not initialized
- **In-App Purchases** — RevenueCat not loaded

## Development Notes

### Adding New Features to Demo Mode

When adding a feature that requires data persistence:
1. Add a new storage key to `DEMO_STORAGE_KEYS` in `localStorageUtils.ts`
2. Add corresponding getter/setter helper functions
3. Implement the feature in the relevant `*Local.tsx` context
4. Ensure the same interface is exported as the Firebase version

### Testing Demo Mode Locally

```bash
# Start dev server in demo mode
EXPO_PUBLIC_DEMO_MODE=true npm run dev
```

### Clearing Demo Data

Call `clearAllDemoData()` from `localStorageUtils.ts` to reset all `@demo_*` keys. This is useful for testing the first-launch experience.
