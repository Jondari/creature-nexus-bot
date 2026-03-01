# Internationalization (i18n)

> Guide for managing translations, adding keys, and maintaining language parity in Creature Nexus TCG.
> Full integration in v0.13.0 (October 2025), enhanced in v0.14.0.

---

## Overview

The app supports two languages: English (source) and French. Translations are stored in JSON data files, loaded at runtime via a lightweight helper (`t(key, params?)`), and kept in sync using CLI tools.

---

## Architecture

| File | Role |
|------|------|
| `data/i18n_en.json` | English translations (source of truth) |
| `data/i18n_fr.json` | French translations |
| `utils/i18n.ts` | Runtime helper: `t(key, params?)` — key lookup + `{{var}}` interpolation |
| `scripts/i18n-sync.js` | CLI tool for checking/syncing FR keys with EN |

---

## Namespaces

| Namespace | Scope |
|-----------|-------|
| `nav.*`, `common.*` | Navigation, shared labels |
| `home.*`, `collection.*`, `decks.*`, `store.*`, `profile.*` | Screen-specific text |
| `elements.*`, `rarities.*`, `player.*`, `actions.*`, `combat.*`, `phases.*`, `game_over.*` | Game terms |
| `audio.*`, `story.*`, `tutorial.*` | Feature-specific text |

---

## CLI Scripts

| Command | Description |
|---------|-------------|
| `npm run i18n:check` | Check missing/extra keys between EN and FR. Exits with code 1 if discrepancies exist (CI-friendly). |
| `npm run i18n:sync` | Fill FR with EN placeholders for missing keys. Exits non-zero if extra keys remain. |
| `npm run i18n:prune` | Fill + prune extra FR keys not present in EN. |

---

## Workflow

1. Add/rename text in code → add keys to `i18n_en.json`
2. Run `npm run i18n:sync` to seed FR placeholders
3. Translate FR values in `i18n_fr.json` (or keep placeholders until ready)
4. Run `npm run i18n:check` before commit/CI to ensure parity

---

## Key Conventions

- Use dotted namespaces: `screen.section.label` (e.g., `home.openPack`)
- Variables with `{{varName}}` (simple interpolation only)
- Keep punctuation in values (not in keys)
- Reuse keys for identical phrases when context allows (`common.ok`, `common.cancel`)

---

## Plurals

The current helper supports only simple interpolation; ICU plurals are not implemented. Handle singular/plural in UI logic or create explicit keys:

```
collection.collectedOne
collection.collectedMany
```

ICU-style entries in JSON are placeholders for future support.

---

## Scene Text Localization

Scene commands (`say`, `choice`) support i18n via the `i18n:` prefix:

```typescript
{ type: 'say', speaker: 'i18n:characters.guide.name', text: 'i18n:story.chapter1.intro.welcome' }
```

The SceneRunner resolves `i18n:key` to `t(key)` at runtime. See [scene-engine.md](scene-engine.md) for details.

---

## Adding a New Language

1. Copy `data/i18n_en.json` → `data/i18n_<locale>.json`
2. Translate values (keep keys identical)
3. Extend loader in `utils/i18n.ts` for runtime locale switching
4. Run `npm run i18n:check` against EN (update script paths if needed)

---

## Tips

- Keep PRs small: add keys + replace usage in the same changeset
- Use `i18n:prune` periodically to drop stale keys from FR
- Avoid touching scene files in the i18n UI pass to reduce rebase conflicts

---

*Last updated: February 2026*
