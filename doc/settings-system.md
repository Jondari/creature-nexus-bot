# Settings System

> Technical documentation for the user preferences system in Creature Nexus TCG.
> Built progressively from v0.2.1 to v0.13.0.

---

## Overview

The settings system manages user preferences (card size, battle log visibility, language) via a React context with AsyncStorage persistence. Settings are loaded on app startup and saved immediately on change.

---

## Architecture

| File | Role |
|------|------|
| `context/SettingsContext.tsx` | `SettingsProvider` context + `useSettings()` hook |

The settings UI is rendered in the profile screen (`app/(tabs)/profile.tsx`).

---

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `cardSize` | `'small'` \| `'normal'` | `'small'` | Card display size throughout the game |
| `showBattleLog` | `boolean` | `false` | Show/hide the battle log during gameplay |
| `screenShake` | `boolean` | `true` | Enable/disable screen shake on combat impacts |
| `turnBanner` | `boolean` | `true` | Show/hide the turn transition banner |
| `locale` | `string` | `'en'` | App language (`'en'` or `'fr'`) |

---

## Context API

```typescript
interface SettingsContextType {
  cardSize: CardSize;
  setCardSize: (size: CardSize) => void;
  showBattleLog: boolean;
  setShowBattleLog: (show: boolean) => void;
  screenShake: boolean;
  setScreenShake: (enabled: boolean) => void;
  turnBanner: boolean;
  setTurnBanner: (enabled: boolean) => void;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  loading: boolean;
}
```

### Usage

```typescript
const { cardSize, setCardSize, locale, setLocale } = useSettings();
```

### Locale Change

`setLocale()` is async — it updates the i18n module (`i18n.setLocale()`) before persisting, ensuring the next render reflects the new language immediately.

---

## Persistence

| Key | Storage | Data |
|-----|---------|------|
| `@creature_nexus_settings` | AsyncStorage | `Settings` JSON |

Settings are loaded once on mount and merged with defaults. Every change triggers an immediate save.

---

## i18n Keys

| Key | EN | FR |
|-----|----|----|
| `profile.gameSettings` | Game Settings | Paramètres du jeu |
| `profile.language` | Language | Langue |
| `profile.appLanguage` | App Language | Langue de l'application |
| `profile.appLanguageDesc` | Choose the language for menus and labels | Choisissez la langue des menus et libellés |
| `profile.cardSize` | Card Size | Taille des cartes |
| `profile.cardSizeDesc` | Choose how cards are displayed throughout the game | Choisissez l'affichage des cartes dans le jeu |
| `profile.cardSizeSmall` | Small | Petite |
| `profile.cardSizeNormal` | Normal | Normale |
| `profile.battleLog` | Battle Log | Journal de combat |
| `profile.battleLogDesc` | Show or hide the battle log during gameplay | Afficher ou masquer le journal pendant les combats |
| `profile.battleLogHidden` | Hidden | Masqué |
| `profile.battleLogVisible` | Visible | Visible |
| `profile.screenShake` | Screen Shake | Tremblement d'écran |
| `profile.screenShakeDesc` | Shake the screen on combat impacts | Secouer l'écran lors des impacts en combat |
| `profile.screenShakeOff` | Off | Désactivé |
| `profile.screenShakeOn` | On | Activé |
| `profile.turnBanner` | Turn Banner | Bandeau de tour |
| `profile.turnBannerDesc` | Show a banner when the turn changes | Afficher un bandeau lors du changement de tour |
| `profile.turnBannerOff` | Off | Désactivé |
| `profile.turnBannerOn` | On | Activé |

---

*Last updated: February 2026*
