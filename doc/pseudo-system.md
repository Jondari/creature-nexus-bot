# Pseudo (Username) System

> Technical documentation for the player pseudo system in Creature Nexus TCG.
> Implemented in v0.22.0 (January 2026).

---

## Overview

The pseudo system assigns each player a unique username. A random default pseudo is generated at account creation, and the player is allowed **one single change** for their lifetime.

### Features

- Random default pseudo on account creation (e.g. `Creature_7842`)
- One-time change with validation (3-16 chars, alphanumeric + underscore)
- Displayed on profile and during battles
- Firebase Firestore synchronization
- Offline cache via AsyncStorage
- Automatic migration for accounts created before the feature
- i18n support (FR/EN)

---

## Architecture

### Files

| File | Role |
|------|------|
| `utils/pseudoUtils.ts` | Validation, generation, constants |
| `context/AuthContext.tsx` | State management and persistence |
| `app/(tabs)/profile.tsx` | Profile UI, change modal |
| `components/GameBoard.tsx` | Passes pseudo to battle UI |
| `components/board/PlayerInfo.tsx` | Display during battles |

---

## Validation Rules

| Rule | Value |
|------|-------|
| Min length | 3 |
| Max length | 16 |
| Allowed characters | `[a-zA-Z0-9_]` (letters, numbers, underscore) |
| Regex | `/^[a-zA-Z0-9_]{3,16}$/` |
| Change limit | **1 per account** (enforced by `pseudoChangeUsed` flag) |

### Default Pseudo Generation

Generated with the pattern `{PREFIX}_{4-digit random number}`.

Available prefixes:
```
Creature, Beast, Monster, Summoner, Traveler, Wanderer, Nomad
```

Example output: `Summoner_4291`

---

## Utility Functions (`utils/pseudoUtils.ts`)

```typescript
// Constants
PSEUDO_REGEX: /^[a-zA-Z0-9_]{3,16}$/
PSEUDO_MIN_LENGTH: 3
PSEUDO_MAX_LENGTH: 16

// Generate a random default pseudo
generateDefaultPseudo(): string

// Returns true if the pseudo is valid
validatePseudo(pseudo: string): boolean

// Returns an i18n error key or null if valid
getPseudoValidationError(pseudo: string): string | null
```

---

## State Management (AuthContext)

### Context Properties

```typescript
pseudo: string | null;
pseudoChangeUsed: boolean;
updatePseudo: (newPseudo: string) => Promise<void>;
```

### Data Flow

```
Account Creation
  → generateDefaultPseudo() → "Creature_7842"
  → Firestore: { pseudo: "Creature_7842", pseudoChangeUsed: false }
  → Local state + AsyncStorage cache

Pseudo Change (one-time)
  → User opens modal on profile page
  → Input validated via getPseudoValidationError()
  → updatePseudo(newPseudo)
    → Firestore: { pseudo: newPseudo, pseudoChangeUsed: true }
    → Local state updated
    → AsyncStorage cache updated
  → Button permanently disabled
```

### One-Time Change Enforcement

- `pseudoChangeUsed` boolean flag in Firestore, set to `true` after first change
- `updatePseudo()` throws if `pseudoChangeUsed` is already `true`
- Profile UI disables the button and shows "Pseudo Changed" when used

---

## Persistence

### Firebase Firestore

```
Collection: users/{uid}
Fields:
  pseudo: string          — current pseudo
  pseudoChangeUsed: boolean — true if change has been used
```

### AsyncStorage

```
Key: pseudo_{userId}
Value: current pseudo string
```

Used as offline fallback when Firestore is unavailable.

### Migration (Legacy Accounts)

Accounts created before the pseudo feature are automatically migrated on first login:
1. If `pseudo` field is `undefined` in Firestore
2. A default pseudo is generated and saved
3. `pseudoChangeUsed` is set to `false` (allows one change)

---

## UI

### Profile Page (`app/(tabs)/profile.tsx`)

- Pseudo displayed below the avatar
- "Change Pseudo" button — disabled after first use
- Modal with:
  - Warning: "You can only change your pseudo once!"
  - Text input with max length enforcement
  - Real-time validation error display
  - Hint text showing allowed format
  - Cancel / Confirm buttons

### Battle (`components/GameBoard.tsx`, `components/board/PlayerInfo.tsx`)

- Pseudo displayed in `PlayerInfo` next to avatar and stats
- Fallback to player default name if pseudo is null
- Used in battle end messages (e.g. "Creature_7842 wins!")

---

## i18n

### Keys

| Key | EN | FR |
|-----|----|----|
| `pseudo.defaultPseudo` | Player | Joueur |
| `pseudo.changePseudo` | Change Pseudo | Changer de pseudo |
| `pseudo.changeUsed` | Pseudo Changed | Pseudo changé |
| `pseudo.changePseudoTitle` | Change Your Pseudo | Changer votre pseudo |
| `pseudo.changePseudoWarning` | Warning: You can only change your pseudo once! | Attention : Vous ne pouvez changer votre pseudo qu'une seule fois ! |
| `pseudo.pseudoPlaceholder` | Enter your new pseudo | Entrez votre nouveau pseudo |
| `pseudo.pseudoHint` | {{min}}-{{max}} characters, letters, numbers and underscore only | {{min}}-{{max}} caractères, lettres, chiffres et underscore uniquement |
| `pseudo.pseudoUpdated` | Pseudo updated successfully! | Pseudo mis à jour avec succès ! |
| `pseudo.pseudoUpdateFailed` | Failed to update pseudo. Please try again. | Échec de la mise à jour du pseudo. Veuillez réessayer. |
| `pseudo.errorTooShort` | Pseudo is too short | Le pseudo est trop court |
| `pseudo.errorTooLong` | Pseudo is too long | Le pseudo est trop long |
| `pseudo.errorInvalidChars` | Pseudo can only contain letters, numbers and underscore | Le pseudo ne peut contenir que des lettres, chiffres et underscore |

---

## Possible Future Extensions

- Allow additional pseudo changes (paid or via promo codes)
- Uniqueness check across all players
- Profanity filter
- Display pseudo in leaderboard / PvP

---

*Last updated: February 2026*
