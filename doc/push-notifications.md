# Push Notifications

> Technical documentation for the push notification system in Creature Nexus TCG.
> Introduced in v0.3.8 (August 2025).

---

## Overview

The notification system alerts players when their free daily pack is ready to open. It supports both mobile (expo-notifications) and web (browser Notification API) platforms, with graceful permission handling.

---

## Architecture

| File | Role |
|------|------|
| `services/notificationService.ts` | `NotificationService` static class — permissions, scheduling, handlers |
| `components/AudioPermissionBanner.tsx` | Not related — notification permission is requested programmatically |

---

## Feature Scope

Currently, notifications are used for a single purpose:

- **Free pack ready** — scheduled 12 hours after the last pack opening, notifying the player their daily free pack is available.

---

## NotificationService API

### Permissions

| Method | Description |
|--------|-------------|
| `requestPermission()` | Request notification permission (returns `NotificationPermissionStatus`) |
| `isPermissionGranted()` | Check if permission is currently granted |
| `shouldRequestPermission()` | Whether the app hasn't asked yet this session |

### Scheduling

| Method | Description |
|--------|-------------|
| `schedulePackNotification(nextTime)` | Schedule a notification for a specific `Date` |
| `scheduleNextPackNotification(lastTimestamp)` | Calculate next pack time and schedule |
| `cancelPackNotifications()` | Cancel any pending pack notification |

### Handlers

| Method | Description |
|--------|-------------|
| `setupNotificationHandlers(navigation?)` | Register listeners for received/tapped notifications |
| `getNextPackTime(lastTimestamp)` | Calculate when the next free pack will be available |

---

## Platform Behavior

### Mobile (iOS/Android)

- Uses `expo-notifications` for permission requests and scheduling
- Notification identifier: `free-pack-ready`
- iOS permissions: alert + sound (no badge, no critical alerts)
- Tapping the notification navigates to the home screen (`index`)

### Web

- Uses the browser `Notification` API
- Scheduling via `setTimeout` (stored on `globalThis.packNotificationTimeout`)
- App icon used as notification icon
- Click handling is limited (no navigation)

---

## Notification Content

Notification title and body are configured via environment variables:

| Variable | Default Value |
|----------|---------------|
| `EXPO_PUBLIC_PACK_READY_NOTIFICATION_TITLE` | Free Pack Ready! |
| `EXPO_PUBLIC_PACK_READY_NOTIFICATION_BODY` | Your daily pack is ready to open! |

---

## Scheduling Flow

```
Player opens a free pack
  → lastPackOpenedTimestamp saved
  → scheduleNextPackNotification(timestamp)
  → getNextPackTime() → Date (now + 12h)
  → cancelPackNotifications() (clear previous)
  → schedulePackNotification(nextTime)
  → Mobile: Notifications.scheduleNotificationAsync({ seconds })
  → Web: setTimeout → new Notification()
```

---

## Notification Handler Configuration

```typescript
// Set at app startup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

---

## Limitations

- Only one notification type (free pack ready)
- Web notifications require the browser tab to be open for `setTimeout` scheduling
- No persistent notification queue — if the app is closed on web, the notification is lost
- No i18n for notification content (uses env variables, not `t()`)
- `setupNotificationHandlers()` navigation parameter is optional and currently not wired on all screens

---

*Last updated: February 2026*
