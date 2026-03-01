#!/usr/bin/env node

/**
 * Redeem Code Admin Console
 * 
 * Usage:
 *   node scripts/redeem-admin.js create
 *   node scripts/redeem-admin.js list
 *   node scripts/redeem-admin.js update <codeId>
 *   node scripts/redeem-admin.js delete <codeId>
 *   node scripts/redeem-admin.js stats
 * 
 * Uses the same Firebase client configuration as the app
 */

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} = require('firebase/firestore');
const readline = require('readline');

// Known valid pack IDs (keep in sync with data/boosterPacks.ts)
const VALID_PACKS = [
  { id: 'standard_pack', name: 'Standard Pack' },
  { id: 'free_daily_pack', name: 'Daily Free Pack' },
  { id: 'fire_pack', name: 'Fire Pack' },
  { id: 'water_pack', name: 'Water Pack' },
  { id: 'earth_pack', name: 'Earth Pack' },
  { id: 'air_pack', name: 'Air Pack' },
  { id: 'mythic_guaranteed_pack', name: 'Mythic Guaranteed Pack' },
  { id: 'legendary_guaranteed_pack', name: 'Legendary Guaranteed Pack' },
];

const VALID_PACK_IDS = new Set(VALID_PACKS.map(p => p.id));

function printValidPacks() {
  console.log('Available Pack IDs:');
  VALID_PACKS.forEach(p => console.log(`  - ${p.id} (${p.name})`));
}

function validatePackIds(packs) {
  const unknown = packs.filter(p => !VALID_PACK_IDS.has(p));
  if (unknown.length) {
    console.log(`❌ Unknown pack ID(s): ${unknown.join(', ')}`);
    printValidPacks();
    return false;
  }
  return true;
}

// Initialize Firebase using same config as app
function initializeFirebase() {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Missing Firebase configuration in .env file');
    console.error('Make sure you have run: npm run setup-env');
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  return getFirestore(app);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Helper functions
function formatDate(date) {
  if (!date) return 'N/A';
  if (date.toDate) date = date.toDate();
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatRewards(rewards) {
  const parts = [];
  if (rewards.nexusCoins) parts.push(`${rewards.nexusCoins} coins`);
  if (rewards.packs?.length) parts.push(`${rewards.packs.length} pack(s)`);
  if (rewards.cards?.length) parts.push(`${rewards.cards.length} card(s)`);
  return parts.join(', ') || 'No rewards';
}

// Command implementations
async function createCode(db) {
  console.log('\n🆕 Creating New Redeem Code\n');

  try {
    const code = (await question('Code (e.g., WELCOME2024): ')).trim().toUpperCase();
    if (!code) {
      console.log('❌ Code is required');
      return;
    }

    // Check if code already exists
    const existingCodes = await getDocs(
      query(collection(db, 'redeemCodes'), where('code', '==', code))
    );
    
    if (!existingCodes.empty) {
      console.log('❌ Code already exists');
      return;
    }

    const description = await question('Description (optional): ');
    
    // Rewards
    console.log('\n📦 Configure Rewards:');
    const nexusCoins = parseInt(await question('Nexus Coins (0 for none): ')) || 0;
    
    printValidPacks();
    const packsInput = await question('Pack IDs (comma-separated, empty for none): ');
    const packs = packsInput.trim() ? packsInput.split(',').map(p => p.trim()) : [];
    if (packs.length && !validatePackIds(packs)) {
      console.log('Aborting create — please use valid pack IDs.');
      return;
    }
    
    const cardsInput = await question('Card IDs (comma-separated, empty for none): ');
    const cards = cardsInput.trim() ? cardsInput.split(',').map(c => c.trim()) : [];

    // Settings
    console.log('\n⚙️ Configure Settings:');
    const isMultiUse = (await question('Multi-use code? (y/N): ')).toLowerCase() === 'y';
    
    let usageLimit = null;
    if (isMultiUse) {
      const limitInput = await question('Usage limit (empty for unlimited): ');
      usageLimit = limitInput.trim() ? parseInt(limitInput) : null;
    }

    const expiryInput = await question('Expiry date (YYYY-MM-DD, empty for 1 year): ');
    let expiryDate;
    if (expiryInput.trim()) {
      expiryDate = new Date(expiryInput + 'T23:59:59Z');
      if (isNaN(expiryDate.getTime())) {
        console.log('❌ Invalid date format');
        return;
      }
    } else {
      expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    // Create the code document
    const codeData = {
      code,
      rewards: {
        ...(nexusCoins > 0 && { nexusCoins }),
        ...(packs.length > 0 && { packs }),
        ...(cards.length > 0 && { cards })
      },
      expiryDate,
      isActive: true,
      isMultiUse,
      ...(usageLimit && { usageLimit }),
      usedCount: 0,
      createdAt: new Date(),
      createdBy: 'admin-console',
      ...(description && { description })
    };

    const docRef = await addDoc(collection(db, 'redeemCodes'), codeData);

    console.log('\n✅ Redeem code created successfully!');
    console.log(`📝 Code: ${code}`);
    console.log(`🆔 Document ID: ${docRef.id}`);
    console.log(`🎁 Rewards: ${formatRewards(codeData.rewards)}`);
    console.log(`📅 Expires: ${formatDate(expiryDate)}`);
    console.log(`🔄 Multi-use: ${isMultiUse ? 'Yes' : 'No'}`);
    if (usageLimit) console.log(`📊 Usage limit: ${usageLimit}`);

  } catch (error) {
    console.error('❌ Error creating code:', error.message);
  }
}

async function listCodes(db) {
  console.log('\n📋 Redeem Codes List\n');

  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'redeemCodes'),
        orderBy('createdAt', 'desc'),
        limit(20)
      )
    );

    if (snapshot.empty) {
      console.log('No redeem codes found.');
      return;
    }

    console.log('Code'.padEnd(15) + 'Active'.padEnd(8) + 'Used'.padEnd(8) + 'Expires'.padEnd(12) + 'Rewards');
    console.log('-'.repeat(70));

    snapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const code = data.code.padEnd(15);
      const active = (data.isActive ? '✅' : '❌').padEnd(8);
      const used = `${data.usedCount || 0}${data.usageLimit ? `/${data.usageLimit}` : ''}`.padEnd(8);
      const expires = data.expiryDate.toDate().toLocaleDateString().padEnd(12);
      const rewards = formatRewards(data.rewards);

      console.log(code + active + used + expires + rewards);
      console.log(`ID: ${docSnapshot.id}`);
      console.log(''); // Empty line for readability
    });

    console.log(`Showing latest 20 codes. Copy the full ID from above for update/delete operations.`);

  } catch (error) {
    console.error('❌ Error listing codes:', error.message);
  }
}

async function updateCode(db, codeId) {
  if (!codeId) {
    console.log('❌ Please provide a code ID');
    return;
  }

  console.log(`\n✏️ Updating Redeem Code: ${codeId}\n`);

  try {
    const docRef = doc(db, 'redeemCodes', codeId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      console.log('❌ Code not found');
      return;
    }

    const data = docSnapshot.data();
    
    console.log('Current values:');
    console.log(`Code: ${data.code}`);
    console.log(`Active: ${data.isActive}`);
    console.log(`Rewards: ${formatRewards(data.rewards)}`);
    console.log(`Expires: ${formatDate(data.expiryDate)}`);
    console.log(`Used: ${data.usedCount || 0}${data.usageLimit ? `/${data.usageLimit}` : ''}`);
    console.log();

    const updates = {};

    // Toggle active status
    const toggleActive = await question(`Toggle active status? Current: ${data.isActive} (y/N): `);
    if (toggleActive.toLowerCase() === 'y') {
      updates.isActive = !data.isActive;
    }

    // Update expiry
    const newExpiry = await question('New expiry date (YYYY-MM-DD, empty to keep current): ');
    if (newExpiry.trim()) {
      const expiryDate = new Date(newExpiry + 'T23:59:59Z');
      if (!isNaN(expiryDate.getTime())) {
        updates.expiryDate = expiryDate;
      } else {
        console.log('❌ Invalid date format, skipping expiry update');
      }
    }

    // Reset usage count
    const resetUsage = await question(`Reset usage count? Current: ${data.usedCount || 0} (y/N): `);
    if (resetUsage.toLowerCase() === 'y') {
      updates.usedCount = 0;
    }

    if (Object.keys(updates).length === 0) {
      console.log('No changes made.');
      return;
    }

    await updateDoc(docRef, updates);
    console.log('✅ Code updated successfully!');

    Object.entries(updates).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Error updating code:', error.message);
  }
}

async function deleteCode(db, codeId) {
  if (!codeId) {
    console.log('❌ Please provide a code ID');
    return;
  }

  console.log(`\n🗑️ Deleting Redeem Code: ${codeId}\n`);

  try {
    const docRef = doc(db, 'redeemCodes', codeId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      console.log('❌ Code not found');
      return;
    }

    const data = docSnapshot.data();
    console.log(`Code: ${data.code}`);
    console.log(`Used ${data.usedCount || 0} times`);
    
    const confirm = await question('\n⚠️ Are you sure you want to delete this code? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('Deletion cancelled.');
      return;
    }

    await deleteDoc(docRef);
    console.log('✅ Code deleted successfully!');

  } catch (error) {
    console.error('❌ Error deleting code:', error.message);
  }
}

async function showStats(db) {
  console.log('\n📊 Redeem Code Statistics\n');

  try {
    const snapshot = await getDocs(collection(db, 'redeemCodes'));
    
    let totalCodes = 0;
    let activeCodes = 0;
    let expiredCodes = 0;
    let totalRedemptions = 0;
    let rewardsByType = {
      nexusCoins: 0,
      packs: 0,
      cards: 0
    };

    const now = new Date();

    snapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      totalCodes++;

      if (data.isActive) {
        if (data.expiryDate.toDate() > now) {
          activeCodes++;
        } else {
          expiredCodes++;
        }
      }

      totalRedemptions += data.usedCount || 0;

      if (data.rewards.nexusCoins) rewardsByType.nexusCoins++;
      if (data.rewards.packs?.length) rewardsByType.packs++;
      if (data.rewards.cards?.length) rewardsByType.cards++;
    });

    console.log(`Total Codes: ${totalCodes}`);
    console.log(`Active Codes: ${activeCodes}`);
    console.log(`Expired Codes: ${expiredCodes}`);
    console.log(`Total Redemptions: ${totalRedemptions}`);
    console.log();
    console.log('Rewards Distribution:');
    console.log(`  Nexus Coins: ${rewardsByType.nexusCoins} codes`);
    console.log(`  Packs: ${rewardsByType.packs} codes`);
    console.log(`  Cards: ${rewardsByType.cards} codes`);

  } catch (error) {
    console.error('❌ Error getting statistics:', error.message);
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  const arg1 = process.argv[3];

  if (!command) {
    console.log(`
🎫 Redeem Code Admin Console

Commands:
  create           Create a new redeem code
  list             List existing redeem codes
  update <id>      Update an existing redeem code
  delete <id>      Delete a redeem code
  stats            Show statistics

Examples:
  node scripts/redeem-admin.js create
  node scripts/redeem-admin.js list
  node scripts/redeem-admin.js update abc123def456
  node scripts/redeem-admin.js delete abc123def456
  node scripts/redeem-admin.js stats

Note: Make sure your .env file is properly configured with Firebase credentials.
`);
    process.exit(0);
  }

  const db = initializeFirebase();

  try {
    switch (command) {
      case 'create':
        await createCode(db);
        break;
      case 'list':
        await listCodes(db);
        break;
      case 'update':
        await updateCode(db, arg1);
        break;
      case 'delete':
        await deleteCode(db, arg1);
        break;
      case 'stats':
        await showStats(db);
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Run without arguments to see available commands.');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the main function
main().catch(console.error);
