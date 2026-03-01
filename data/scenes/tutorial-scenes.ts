/**
 * Tutorial Scenes
 * 
 * Scene definitions for the tutorial system. These scenes guide new players
 * through the core game mechanics and UI elements.
 */

import type { SceneSpec } from '@/types/scenes';
import { COMMON_ANCHORS, SCENE_TRIGGERS } from '@/types/scenes';

// First Launch Tutorial - Overall game introduction
export const SCENE_FIRST_LAUNCH: SceneSpec = {
  id: 'tutorial_first_launch',
  version: 1,
  title: 'Welcome to Creature Nexus TCG',
  description: 'Initial welcome and overview tutorial',
  triggers: [
    { type: 'onFirstLaunch' }
  ],
  backgroundImage: require('@/assets/images/scene/nexus_welcome_bg.png'),
  steps: [
    { type: 'showPortrait', side: 'right', uri: 'guide_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.firstLaunch.welcome' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.firstLaunch.realmOverview' },
    { type: 'choice', choices: [
      { id: 'ready', text: 'i18n:tutorial.firstLaunch.choiceReady', goto: 'intro_story' },
      { id: 'explain', text: 'i18n:tutorial.firstLaunch.choiceExplain', goto: 'lore_explanation' }
    ]},
    
    { type: 'label', name: 'lore_explanation' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.firstLaunch.loreIntersection' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.firstLaunch.loreBalance' },
    { type: 'goto', label: 'intro_story' },
    
    { type: 'label', name: 'intro_story' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.firstLaunch.storyIntro' },
    { type: 'setFlag', key: 'tutorial_first_launch_completed', value: true },
    { type: 'navigateTo', screen: 'story-mode' },
    { type: 'end' }
  ],
  priority: 100
};

// Story Mode Introduction
export const SCENE_STORY_MODE_INTRO: SceneSpec = {
  id: 'tutorial_story_intro',
  version: 1,
  title: 'Story Mode Introduction',
  description: 'Introduction to story mode and chapter navigation',
  triggers: [
    { type: 'onEnterScreen', screen: 'story-mode' }
  ],
  conditions: {
    flags: { 'tutorial_story_intro_completed': false }
  },
  steps: [
    { type: 'showPortrait', side: 'left', uri: 'guide_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.storyIntro.opening' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.CHAPTER_NODE, text: 'i18n:tutorial.storyIntro.chapterNodes', maskInput: true, textPosition: 'top' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.storyIntro.realmOverview' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.storyIntro.unlock' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.storyIntro.cta' },
    { type: 'setFlag', key: 'tutorial_story_intro_completed', value: true },
    { type: 'hidePortrait', side: 'left', animation: 'slideOut' },
    { type: 'end' }
  ],
  priority: 90
};

// Chapter Map Tutorial
export const SCENE_CHAPTER_MAP_INTRO: SceneSpec = {
  id: 'tutorial_chapter_map',
  version: 1,
  title: 'Chapter Map Tutorial',
  description: 'How to navigate within a chapter',
  triggers: [
    { type: 'onEnterScreen', screen: 'chapter-map' }
  ],
  conditions: {
    flags: { 'tutorial_chapter_map_completed': false }
  },
  steps: [
    { type: 'showPortrait', side: 'right', uri: 'guide_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.chapterMapIntro.welcome' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.BATTLE_NODE, text: 'i18n:tutorial.chapterMapIntro.battleNodes', maskInput: true },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.chapterMapIntro.statusLegend' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.chapterMapIntro.progression' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.BATTLE_NODE, text: 'i18n:tutorial.chapterMapIntro.cta', maskInput: false },
    { type: 'setFlag', key: 'tutorial_chapter_map_completed', value: true },
    { type: 'hidePortrait', side: 'right', animation: 'slideOut' },
    { type: 'end' }
  ],
  priority: 85
};

// Battle Screen Tutorial - Comprehensive battle mechanics
export const SCENE_BATTLE_TUTORIAL: SceneSpec = {
  id: 'tutorial_battle_basics',
  version: 2,
  title: 'Battle Basics',
  description: 'Complete tutorial for battle mechanics',
  triggers: [
    { type: 'onEnterScreen', screen: 'battle-tutorial' }
  ],
  priority: 95,
  steps: [
    { type: 'showPortrait', side: 'right', uri: 'strategist_portrait.png', animation: 'slideIn', mirror: true },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.welcome' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.PLAYER_HP, text: 'i18n:tutorial.battleIntro.playerStatusBar', maskInput: true, textPosition: "top" },
    { type: 'highlight', anchorId: COMMON_ANCHORS.ENEMY_HP, text: 'i18n:tutorial.battleIntro.enemyStatusBar', maskInput: true },
    { type: 'highlight', anchorId: COMMON_ANCHORS.ENERGY_DISPLAY, text: 'i18n:tutorial.battleIntro.energy', maskInput: true, textPosition: "top" },
    { type: 'highlight', anchorId: COMMON_ANCHORS.HAND_AREA, text: 'i18n:tutorial.battleIntro.hand', maskInput: true, textPosition: "top" },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.cardsCost' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.playPrompt' },
    { type: 'maskInput', enabled: false },
    { type: 'if', flag: 'card_played', then: 'after_card_played', else: 'wait_for_card' },
    { type: 'label', name: 'wait_for_card' },
    { type: 'wait', ms: 2000 },
    { type: 'if', flag: 'card_played', then: 'after_card_played', else: 'prompt_card_play' },
    { type: 'label', name: 'prompt_card_play' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.playReminder' },
    { type: 'goto', label: 'wait_for_card' },
    { type: 'label', name: 'after_card_played' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.cardPlaced' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.playMore' },
    { type: 'checkProgress', key: 'cards_in_play', min: 4, then: 'after_four_cards', else: 'wait_for_more_cards' },
    { type: 'label', name: 'wait_for_more_cards' },
    { type: 'wait', ms: 2000 },
    { type: 'checkProgress', key: 'cards_in_play', min: 4, then: 'after_four_cards', else: 'prompt_more_cards' },
    { type: 'label', name: 'prompt_more_cards' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.playMoreReminder' },
    { type: 'goto', label: 'wait_for_more_cards' },
    { type: 'label', name: 'after_four_cards' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.FIELD_AREA, text: 'i18n:tutorial.battleIntro.battlefield', maskInput: true, textPosition: "top" },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.firstTurnNoAttack' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.ENEMY_FIELD, text: 'i18n:tutorial.battleIntro.enemyField', maskInput: true },
    { type: 'highlight', anchorId: COMMON_ANCHORS.TURN_STATUS, text: 'i18n:tutorial.battleIntro.turnStatus', maskInput: true, textPosition: "top" },
    { type: 'highlight', anchorId: COMMON_ANCHORS.END_TURN_BUTTON, text: 'i18n:tutorial.battleIntro.endTurnButton', maskInput: true },
    { type: 'maskInput', enabled: false },
    { type: 'if', flag: 'turn_ended', then: 'after_turn_ended', else: 'wait_for_turn_end' },
    { type: 'label', name: 'wait_for_turn_end' },
    { type: 'wait', ms: 2000 },
    { type: 'if', flag: 'turn_ended', then: 'after_turn_ended', else: 'prompt_turn_end' },
    { type: 'label', name: 'prompt_turn_end' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.endTurnReminder' },
    { type: 'goto', label: 'wait_for_turn_end' },
    { type: 'label', name: 'after_turn_ended' },
    { type: 'maskInput', enabled: false },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.turnCycle' },
    { type: 'label', name: 'wait_for_opponent_turn' },
    { type: 'if', flag: 'ai_turn_completed', then: 'opponent_turn_complete', else: 'opponent_turn_wait' },
    { type: 'label', name: 'opponent_turn_wait' },
    { type: 'wait', ms: 1000 },
    { type: 'goto', label: 'wait_for_opponent_turn' },
    { type: 'label', name: 'opponent_turn_complete' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.attackReady' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.attackIntro' },
    { type: 'maskInput', enabled: false },
    { type: 'if', flag: 'creature_selected', then: 'explain_attacks', else: 'wait_for_selection' },
    { type: 'label', name: 'wait_for_selection' },
    { type: 'wait', ms: 2000 },
    { type: 'if', flag: 'creature_selected', then: 'explain_attacks', else: 'prompt_selection' },
    { type: 'label', name: 'prompt_selection' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.attackReminder' },
    { type: 'goto', label: 'wait_for_selection' },
    { type: 'label', name: 'explain_attacks' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.attackExplain' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.autoEnd' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.manualEnd' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.fieldManage' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.attackPreview' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.END_TURN_BUTTON, text: 'i18n:tutorial.battleIntro.endTurnButton', maskInput: true },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.turnCycle' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.strategyHeading' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.strategyEnergy' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.strategyAffinity' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.strategyPlanning' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.closing' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.battleGuide', text: 'i18n:tutorial.battleIntro.farewell' },
    { type: 'setFlag', key: 'tutorial_battle_completed', value: true },
    { type: 'hidePortrait', side: 'left', animation: 'slideOut' },
    { type: 'end' }
  ]
};

// First Victory Celebration
/*
export const SCENE_FIRST_VICTORY: SceneSpec = {
  id: 'tutorial_first_victory',
  version: 1,
  title: 'First Victory!',
  description: 'Celebration and explanation of victory rewards',
  triggers: [
    { type: 'onBattleEnd', result: 'win' }
  ],
  conditions: {
    flags: { 'tutorial_first_victory_completed': false }
  },
  steps: [
    { type: 'setBackground', uri: 'victory_bg.png', transition: 'fade' },
    { type: 'showPortrait', side: 'right', uri: 'guide_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'Nexus Guide', text: 'Congratulations on your first victory!' },
    { type: 'say', speaker: 'Nexus Guide', text: 'Each victory grants you rewards: Nexus Coins and sometimes booster packs!' },
    { type: 'say', speaker: 'Nexus Guide', text: 'Nexus Coins can be used to buy more packs in the Store.' },
    { type: 'say', speaker: 'Nexus Guide', text: 'Booster packs contain new creatures to strengthen your collection.' },
    { type: 'say', speaker: 'Nexus Guide', text: 'Keep battling to unlock new chapters and discover powerful legendary creatures!' },
    { type: 'setFlag', key: 'tutorial_first_victory_completed', value: true },
    { type: 'setProgress', key: 'battles_won', value: 1 },
    { type: 'hidePortrait', side: 'right', animation: 'slideOut' },
    { type: 'end' }
  ],
  priority: 75
};
*/

// Home Screen Overview
export const SCENE_HOME_INTRO: SceneSpec = {
  id: 'tutorial_home_intro',
  version: 1,
  title: 'Welcome Home',
  description: 'Highlights key elements on the home screen',
  triggers: [
    { type: 'onEnterScreen', screen: 'home' }
  ],
  conditions: {
    flags: {
      'tutorial_home_completed': false,
      'tutorial_first_launch_completed': true,
    }
  },
  steps: [
    { type: 'showPortrait', side: 'left', uri: 'guide_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.homeIntro.opening' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.OPEN_PACK_BUTTON, text: 'i18n:tutorial.homeIntro.dailyPack', maskInput: true },
    { type: 'highlight', anchorId: COMMON_ANCHORS.PACK_INVENTORY, text: 'i18n:tutorial.homeIntro.packInventory', maskInput: true },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusGuide', text: 'i18n:tutorial.homeIntro.openPacks' },
    { type: 'setFlag', key: 'tutorial_home_completed', value: true },
    { type: 'hidePortrait', side: 'left', animation: 'slideOut' },
    { type: 'end' }
  ],
  priority: 72
};

// Collection Tutorial
export const SCENE_COLLECTION_INTRO: SceneSpec = {
  id: 'tutorial_collection_intro',
  version: 1,
  title: 'Your Collection',
  description: 'Introduction to the collection screen',
  triggers: [
    { type: 'onEnterScreen', screen: 'collection' }
  ],
  conditions: {
    flags: { 'tutorial_collection_completed': false }
  },
  steps: [
    { type: 'showPortrait', side: 'left', uri: 'guide_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.collectionGuide', text: 'i18n:tutorial.collectionIntro.welcome' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.CARD_GRID, text: 'i18n:tutorial.collectionIntro.cardGrid', maskInput: true },
    { type: 'say', speaker: 'i18n:tutorial.speakers.collectionGuide', text: 'i18n:tutorial.collectionIntro.rarityInfo' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.collectionGuide', text: 'i18n:tutorial.collectionIntro.strategyHint' },
    { type: 'setFlag', key: 'tutorial_collection_completed', value: true },
    { type: 'hidePortrait', side: 'left', animation: 'slideOut' },
    { type: 'end' }
  ],
  priority: 70
};

// Deck Building Tutorial
export const SCENE_DECK_BUILDER_INTRO: SceneSpec = {
  id: 'tutorial_deck_builder',
  version: 1,
  title: 'Build Your Deck',
  description: 'Introduction to deck building mechanics',
  triggers: [
    { type: 'onEnterScreen', screen: 'decks' }
  ],
  conditions: {
    flags: { 'tutorial_deck_builder_completed': false }
  },
  steps: [
    { type: 'showPortrait', side: 'right', uri: 'guide_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.deckMaster', text: 'i18n:tutorial.deckBuilderIntro.opening' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.DECK_BUILDER_ENTRY, text: 'i18n:tutorial.deckBuilderIntro.highlightEntry', maskInput: true, textPosition: 'top' },
    { type: 'maskInput', enabled: false },
    { type: 'label', name: 'wait_for_deck_builder' },
    { type: 'wait', ms: 400 },
    { type: 'if', flag: 'deck_builder_open', then: 'deck_builder_opened', else: 'prompt_open_deck_builder' },

    { type: 'label', name: 'prompt_open_deck_builder' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.deckMaster', text: 'i18n:tutorial.deckBuilderIntro.promptOpen' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.DECK_BUILDER_ENTRY, text: 'i18n:tutorial.deckBuilderIntro.highlightEntry', maskInput: true, textPosition: 'top' },
    { type: 'maskInput', enabled: false },
    { type: 'wait', ms: 600 },
    { type: 'goto', label: 'wait_for_deck_builder' },

    { type: 'label', name: 'deck_builder_opened' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.deckMaster', text: 'i18n:tutorial.deckBuilderIntro.tourIntro' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.DECK_EDITOR_INFO, text: 'i18n:tutorial.deckBuilderIntro.infoPanel', maskInput: true },
    { type: 'highlight', anchorId: COMMON_ANCHORS.DECK_EDITOR_FILTERS, text: 'i18n:tutorial.deckBuilderIntro.filters', maskInput: true },
    { type: 'highlight', anchorId: COMMON_ANCHORS.DECK_EDITOR_GRID, text: 'i18n:tutorial.deckBuilderIntro.grid', maskInput: true },
    { type: 'highlight', anchorId: COMMON_ANCHORS.DECK_EDITOR_CURRENT_DECK_BUTTON, text: 'i18n:tutorial.deckBuilderIntro.currentDeck', maskInput: true, textPosition: 'bottom' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.DECK_EDITOR_SAVE_BUTTON, text: 'i18n:tutorial.deckBuilderIntro.save', maskInput: true, textPosition: 'bottom' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.deckMaster', text: 'i18n:tutorial.deckBuilderIntro.limitReminder' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.deckMaster', text: 'i18n:tutorial.deckBuilderIntro.encouragement' },
    { type: 'setFlag', key: 'tutorial_deck_builder_completed', value: true },
    { type: 'hidePortrait', side: 'right', animation: 'slideOut' },
    { type: 'end' }
  ],
  priority: 65
};

// Store Introduction
export const SCENE_STORE_INTRO: SceneSpec = {
  id: 'tutorial_store_intro',
  version: 1,
  title: 'The Nexus Store',
  description: 'Introduction to the store and pack purchasing',
  triggers: [
    { type: 'onEnterScreen', screen: 'store' }
  ],
  conditions: {
    flags: { 'tutorial_store_completed': false }
  },
  steps: [
    { type: 'showPortrait', side: 'left', uri: 'merchant_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusMerchant', text: 'i18n:tutorial.storeIntro.welcome' },
    { type: 'highlight', anchorId: COMMON_ANCHORS.COIN_BALANCE, text: 'i18n:tutorial.storeIntro.coinBalance', maskInput: true },
    { type: 'highlight', anchorId: COMMON_ANCHORS.PACK_SHOP, text: 'i18n:tutorial.storeIntro.packShop', maskInput: true },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusMerchant', text: 'i18n:tutorial.storeIntro.standardPacks' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusMerchant', text: 'i18n:tutorial.storeIntro.elementalPacks' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusMerchant', text: 'i18n:tutorial.storeIntro.premiumPacks' },
    { type: 'say', speaker: 'i18n:tutorial.speakers.nexusMerchant', text: 'i18n:tutorial.storeIntro.freePack' },
    { type: 'setFlag', key: 'tutorial_store_completed', value: true },
    { type: 'hidePortrait', side: 'left', animation: 'slideOut' },
    { type: 'end' }
  ],
  priority: 60
};

// Advanced Battle Mechanics (triggered after several battles)
/*
export const SCENE_ADVANCED_BATTLE: SceneSpec = {
  id: 'tutorial_advanced_battle',
  version: 1,
  title: 'Advanced Battle Tactics',
  description: 'Advanced battle strategies and element advantages',
  triggers: [
    { type: 'onBattleStart' }
  ],
  conditions: {
    flags: { 'tutorial_advanced_battle_completed': false },
    progress: { 'battles_won': 3 }
  },
  steps: [
    { type: 'showPortrait', side: 'right', uri: 'strategist_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'Battle Strategist', text: 'You\'re getting the hang of this! Let me share some advanced tactics.' },
    { type: 'say', speaker: 'Battle Strategist', text: 'Element Advantages: Fire beats Earth, Earth beats Water, Water beats Fire, and Air disrupts all!' },
    { type: 'say', speaker: 'Battle Strategist', text: 'When your element has advantage, your attacks deal extra damage!' },
    { type: 'say', speaker: 'Battle Strategist', text: 'Energy management is crucial - sometimes passing a turn to save energy is wise.' },
    { type: 'say', speaker: 'Battle Strategist', text: 'Watch your opponent\'s patterns. Good timing can turn the tide!' },
    { type: 'say', speaker: 'Battle Strategist', text: 'Finally, don\'t be afraid to retreat and reorganize your deck if you keep losing.' },
    { type: 'setFlag', key: 'tutorial_advanced_battle_completed', value: true },
    { type: 'hidePortrait', side: 'right', animation: 'slideOut' },
    { type: 'end' }
  ],
  priority: 55
};
*/

// Export all tutorial scenes
export const ALL_TUTORIAL_SCENES: SceneSpec[] = [
  SCENE_FIRST_LAUNCH,
  SCENE_STORY_MODE_INTRO,
  SCENE_CHAPTER_MAP_INTRO,
  SCENE_BATTLE_TUTORIAL,
  //SCENE_FIRST_VICTORY,
  SCENE_HOME_INTRO,
  SCENE_COLLECTION_INTRO,
  SCENE_DECK_BUILDER_INTRO,
  SCENE_STORE_INTRO,
  //SCENE_ADVANCED_BATTLE,
];
