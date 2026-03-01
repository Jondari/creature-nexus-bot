#!/usr/bin/env node
/**
 * Simple i18n sync/verify script
 * - Ensures all keys from EN exist in FR
 * - Prints missing keys and can optionally write placeholders
 * Usage:
 *   node scripts/i18n-sync.js           # list missing keys
 *   node scripts/i18n-sync.js --write   # fill FR with EN placeholders
 */
const fs = require('fs');
const path = require('path');

const enPath = path.resolve(__dirname, '..', 'data', 'i18n_en.json');
const frPath = path.resolve(__dirname, '..', 'data', 'i18n_fr.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function ensureKeys(base, target) {
  const missing = [];
  for (const key of Object.keys(base)) {
    if (!(key in target)) missing.push(key);
  }
  return missing;
}

function deepGet(obj, pathStr) {
  return pathStr.split('.').reduce((acc, p) => (acc ? acc[p] : undefined), obj);
}

function deepSet(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let cur = obj;
  parts.forEach((p, idx) => {
    if (idx === parts.length - 1) {
      cur[p] = value;
    } else {
      if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
      cur = cur[p];
    }
  });
}

const args = process.argv.slice(2);
const write = args.includes('--write');
const prune = args.includes('--prune');

const en = loadJson(enPath);
const fr = loadJson(frPath);
const flatEn = flatten(en);
const flatFr = flatten(fr);

const missingInFr = ensureKeys(flatEn, flatFr);
const extraInFr = ensureKeys(flatFr, flatEn); // present in FR, absent in EN

if (missingInFr.length === 0 && extraInFr.length === 0) {
  console.log('✅ No missing or extra keys.');
  process.exit(0);
}

if (missingInFr.length > 0) {
  console.log('Missing keys in FR:');
  missingInFr.forEach(k => console.log(' -', k));
}

if (extraInFr.length > 0) {
  console.log('\nExtra keys in FR (not in EN):');
  extraInFr.forEach(k => console.log(' -', k));
}

if (write) {
  // Write placeholders (copy EN values)
  missingInFr.forEach(key => {
    const src = deepGet(en, key);
    deepSet(fr, key, src);
  });
  let prunedCount = 0;
  if (prune && extraInFr.length > 0) {
    // Deep delete utility
    const deepDelete = (obj, pathStr) => {
      const parts = pathStr.split('.');
      let cur = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!cur[p] || typeof cur[p] !== 'object') return; // nothing to delete
        cur = cur[p];
      }
      delete cur[parts[parts.length - 1]];
    };
    extraInFr.forEach(key => {
      deepDelete(fr, key);
      prunedCount++;
    });
  }
  saveJson(frPath, fr);
  console.log(`✍️  Wrote ${missingInFr.length} placeholders to FR`);
  if (prune) {
    console.log(`🧹 Pruned ${prunedCount} extra keys from FR`);
  }
  // Exit 0 if no remaining extras after prune, else 1
  process.exit(prune ? 0 : (extraInFr.length > 0 ? 1 : 0));
} else {
  console.log('\nRun with --write to fill FR with EN placeholders.');
  process.exit(1);
}
