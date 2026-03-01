# Custom Alert System

> Technical documentation for the cross-platform alert system in Creature Nexus TCG.
> Introduced in v0.2.10 (August 2025).

---

## Overview

The custom alert system replaces the native `Alert.alert()` with a consistent, styled modal that works identically on all platforms (web, iOS, Android). It uses a global manager pattern so alerts can be triggered from anywhere in the codebase without passing props.

---

## Architecture

| File | Role |
|------|------|
| `components/CustomAlert.tsx` | Modal alert component (UI) |
| `components/GlobalAlertProvider.tsx` | Provider that registers the global manager and renders `CustomAlert` |
| `utils/alerts.ts` | Global API: `showAlert()`, convenience methods, manager registration |

### Setup

`GlobalAlertProvider` wraps the entire app in `app/_layout.tsx`:

```tsx
<GlobalAlertProvider>
  {/* app content */}
</GlobalAlertProvider>
```

On mount, it calls `setGlobalAlertManager()` to register itself. From that point on, any call to `showAlert()` renders through the provider's `CustomAlert`.

---

## API — `utils/alerts.ts`

### Core

```typescript
showAlert(title: string, message: string, buttons?: AlertButton[], type?: 'success' | 'error' | 'warning')
```

### Convenience Methods

| Method | Type | Buttons |
|--------|------|---------|
| `showSuccessAlert(title, message, onPress?)` | `success` | OK |
| `showErrorAlert(title, message, onPress?)` | `error` | OK |
| `showWarningAlert(title, message, onPress?)` | `warning` | OK |
| `showConfirmAlert(title, message, onConfirm, onCancel?, confirmText?, cancelText?)` | `warning` | Cancel + Confirm (destructive) |

### AlertButton

```typescript
interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}
```

---

## CustomAlert Component

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | — | Show/hide the modal |
| `title` | `string` | — | Alert title |
| `message` | `string` | — | Alert body text |
| `type` | `'success'` \| `'error'` \| `'warning'` | `'error'` | Determines icon and button color |
| `onClose` | `() => void` | — | Called when modal should close |
| `confirmText` | `string` | `'OK'` | Default confirm button text (legacy) |
| `onConfirm` | `() => void` | — | Legacy confirm callback |
| `showCancel` | `boolean` | `false` | Legacy cancel button toggle |
| `buttons` | `AlertButton[]` | — | Custom buttons (overrides legacy props) |

### Visual Types

| Type | Icon | Color |
|------|------|-------|
| `success` | CheckCircle | `#22c55e` (green) |
| `warning` | AlertTriangle | `#f59e0b` (amber) |
| `error` | AlertTriangle | `#ef4444` (red) |

### Platform Handling

- **Mobile**: 50ms delay before showing content to prevent React Native new architecture modal flash
- **Web**: Content shown immediately
- **Android**: `statusBarTranslucent` enabled for full overlay
- Uses `Modal` component with `transparent` and `fade` animation

---

## Usage Example

```typescript
import { showConfirmAlert, showSuccessAlert } from '@/utils/alerts';

// Confirmation dialog
showConfirmAlert(
  'Delete Deck',
  'Are you sure you want to delete this deck?',
  () => deleteDeck(deckId),
  undefined,
  'Delete',
  'Cancel'
);

// Success feedback
showSuccessAlert('Pack Opened!', 'You received 5 new cards.');
```

---

*Last updated: February 2026*
