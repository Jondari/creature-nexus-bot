# Electron Desktop Integration

> Technical documentation for the Electron desktop build of Creature Nexus TCG.
> Added in v0.24.0 (February 4, 2026). Status: **WIP** — window opens but app content does not load.

---

## Overview

The Electron integration wraps the Expo web export into a native desktop application for Windows distribution. It uses a two-mode approach: a live dev server for development and static file loading for production.

### Current Status

| Area | Status |
|------|--------|
| Electron configuration (main.js, preload.js, builder) | Done |
| NPM scripts (electron:dev, electron:build) | Done |
| Dependencies installed | Done |
| Build process completes (~308 MB installer) | Done |
| Window opens with correct background (#121626) | Done |
| **App content loads** | **Not working** |

---

## Architecture

### Files

```
electron/
├── main.js              # Main Electron process
├── preload.js           # Context bridge (exposes window.creatureNexus.platform)
└── electron-builder.yml # Build configuration (Windows NSIS)
```

### How It Works

```
[Expo Web Build]  →  dist/index.html  →  [Electron BrowserWindow]
      or
[Expo Dev Server]  →  http://localhost:19006  →  [Electron BrowserWindow]
```

- **Development**: Electron loads from the live Expo web dev server (port 19006)
- **Production**: Electron loads the static export from `dist/index.html` via `file://` protocol

---

## Commands

```bash
# Development — starts Expo web server + Electron window
npm run electron:dev

# Production build — exports web + packages Windows installer
npm run electron:build
```

### Development Flow (`electron:dev`)

1. Sets `ELECTRON_START_URL=http://localhost:19006`
2. Starts Expo web server (`expo start --web`)
3. Waits for port 19006 to be available (`wait-on`)
4. Launches Electron pointing to the dev server
5. DevTools open automatically

### Build Flow (`electron:build`)

1. Cleans `dist/` and `release/` directories (`rimraf`)
2. Runs `expo export --platform web` → static files in `dist/`
3. Runs `electron-builder` with `electron-builder.yml`
4. Outputs installer to `release/`

---

## Main Process (`electron/main.js`)

```javascript
const isDev = Boolean(process.env.ELECTRON_START_URL);

const getIndexUrl = () => {
  if (isDev) return process.env.ELECTRON_START_URL;
  return new URL('../dist/index.html', `file://${__dirname}/`).toString();
};
```

### Window Configuration

| Setting | Value |
|---------|-------|
| Width | 1280px |
| Height | 720px |
| Background color | `#121626` |
| Menu bar | Hidden (`autoHideMenuBar: true`) |
| Icon | `assets/images/icon.png` |
| Context isolation | Enabled |
| Node integration | Disabled |
| Sandbox | Disabled |
| DevTools (dev mode) | Auto-open, detached |

### App Identity

- **App ID**: `com.jondari.creaturenexustcg`
- **Product Name**: Creature Nexus TCG

---

## Preload Script (`electron/preload.js`)

Exposes a minimal API to the renderer process via context bridge:

```javascript
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('creatureNexus', {
  platform: 'desktop'
});
```

### Platform Detection in App Code

```typescript
const isElectron = typeof window !== 'undefined' &&
  (window as any).creatureNexus?.platform === 'desktop';
```

Currently not actively used by the app, but available for future platform-specific behavior.

---

## Build Configuration (`electron/electron-builder.yml`)

```yaml
appId: com.jondari.creaturenexustcg
productName: Creature Nexus TCG
files:
  - dist/**/*
  - electron/**/*
  - package.json
  - "!node_modules/**/*"
directories:
  output: release
  buildResources: assets/images
extraMetadata:
  main: electron/main.js
asar: true
win:
  target:
    - nsis
  icon: assets/images/icon.png
publish: []
```

| Setting | Value |
|---------|-------|
| Packaging format | ASAR |
| Windows target | NSIS installer |
| Output directory | `release/` |
| Auto-update | Disabled (`publish: []`) |
| Icon | `assets/images/icon.png` (1024x1024 PNG) |

### Build Output

```
release/
├── Creature Nexus TCG Setup X.X.X.exe   # Windows installer (~308 MB)
├── Creature Nexus TCG Setup X.X.X.exe.blockmap
├── win-unpacked/                          # Unpacked app directory
└── latest.yml                             # Update metadata
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `electron` | ^33.2.0 | Desktop runtime |
| `electron-builder` | ^25.1.8 | Packaging and installer creation |
| `concurrently` | ^9.1.0 | Run Expo + Electron in parallel |
| `cross-env` | ^7.0.3 | Cross-platform env variable setting |
| `wait-on` | ^8.0.2 | Wait for dev server before launching Electron |
| `rimraf` | ^6.0.1 | Clean build directories |

All are devDependencies — not included in the production build.

---

## Security

- **Context isolation**: Enabled — renderer has no direct access to Node.js APIs
- **Node integration**: Disabled — prevents `require()` in renderer
- **Preload script**: Only exposes `creatureNexus.platform` (minimal surface)
- **No IPC**: No inter-process communication implemented yet

---

## Known Issue: App Content Not Loading

The Electron window opens with the correct background color but the Expo app does not render.

### Possible Root Causes

1. **Routing issue**: Expo Router may not initialize correctly with `file://` protocol
2. **Path resolution**: `dist/index.html` asset paths may be incorrect for local file loading
3. **CSP issue**: Content Security Policy may block inline scripts
4. **Base URL**: Expo web export may expect a server-based base URL

### Investigation Steps

1. Launch app and press F12 to check console errors in DevTools
2. Check Network tab to verify all assets load correctly
3. Test with a simple HTML file to isolate the issue
4. Consider using `electron-serve` for proper static file serving
5. Configure Expo web output for Electron compatibility (custom base URL)

---

## Current Limitations

- **Windows only**: No macOS or Linux build configured
- **No code signing**: Installer is unsigned
- **No auto-update**: No update framework configured
- **No Steam integration**: Standalone installer only
- **No CI/CD**: Manual build process
- **No native modules**: No Electron-specific native features used
- **No crash reporting**: No Sentry or equivalent configured

---

## Notes

- First build on Windows may require admin privileges (symbolic links)
- `release/` and `dist/` directories are gitignored
- `node_modules` is excluded from the packaged app to reduce size

---

*Last updated: February 2026*
