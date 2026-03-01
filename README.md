# Creature Nexus TCG

[![Netlify Status](https://api.netlify.com/api/v1/badges/7f369d2a-ba9a-46d9-982a-7b74f39c05b8/deploy-status)](https://app.netlify.com/projects/creature-nexus/deploys)

A cross-platform digital trading card game featuring mythical creatures, built with Expo and React Native.

## Features

- PvE battles against AI with elemental affinity system
- Story mode with 6 elemental chapters and 30+ battles
- Card collection with 5 rarities (common, rare, epic, legendary, mythic)
- Deck builder (20–60 cards, max 3 copies per model)
- Shop with packs, promo codes, and Nexus Coins economy
- 5 battlefield themes with animated particle effects
- Tutorial system with visual novel engine
- Player identity (avatar, pseudo)
- Authentication: anonymous, email/password, Google OAuth
- Internationalization (English / French)
- Platforms: Web (Netlify), Android, iOS, Desktop (Electron — experimental)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jondari/creature-nexus-tcg.git
cd creature-nexus-tcg
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
```

## Deployment

To deploy the web version of the app:

1. Build the web version:
```bash
npm run build:web
```

(Optional but required for itch.io) Run the post-processing script to make every asset path relative:
```bash
node scripts/fix-web-build.js
```

2. Deploy to Firebase Hosting:
```bash
npm run deploy
```

## Demo Mode (itch.io)

A standalone demo build can run without Firebase, using local storage for all data. Set `EXPO_PUBLIC_DEMO_MODE=true` then follow the deployment steps above (build + `fix-web-build.js`) and upload the `dist/` folder to itch.io as an HTML5 game.

In demo mode, authentication, story mode, promo codes, and cloud sync are disabled. See [doc/demo-mode.md](doc/demo-mode.md) for full details.

## Desktop (Electron)

1. Start development mode (opens Expo Web + Electron):
```bash
npm run electron:dev
```
2. Generate a desktop build ready for packaging:
```bash
npm run electron:build
```
This command first exports the Expo web bundle to `dist/`, then `electron-builder` produces Windows executables in `release/`.

## Project Structure

- `app/` - Screens and navigation (Expo Router)
- `components/` - Reusable React components
- `config/` - Firebase configuration
- `context/` - React Contexts (Auth, Game, Deck, StoryMode, Settings, etc.)
- `data/` - Card definitions, story chapters, scenes, i18n files
- `modules/` - Game engine (Player, battle logic)
- `types/` - TypeScript type definitions
- `utils/` - Utility functions
- `constants/` - App constants (colors, themes, etc.)

## Documentation

See the [doc/](doc/INDEX.md) folder for detailed feature documentation.

## Firebase Setup

1. Create a new Firebase project in the Firebase console
2. Enable Anonymous Authentication
3. Create a Firestore database
4. Set up Firestore security rules to protect user data
5. Add your web app to the Firebase project to get configuration details

## License

This project is licensed under the MIT License - see the LICENSE file for details.
