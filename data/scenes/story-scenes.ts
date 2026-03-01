/**
 * Story Scenes
 * 
 * Narrative scenes for the story mode. These scenes provide context,
 * character development, and world-building between battles.
 */

import type { SceneSpec } from '@/types/scenes';

// Main Story Arc - Chapter 1: The Water Realm
export const SCENE_CHAPTER_1_INTRO: SceneSpec = {
  /*
  id: 'story_chapter_1_intro',
  version: 1,
  title: 'The Nexus Awakens',
  description: 'Introduction to the Water Realm crisis',
  triggers: [
    { type: 'onStoryProgress', chapterId: 1 }
  ],
  conditions: {
    flags: { 'story_chapter_1_intro_completed': false }
  },
  backgroundImage: 'water_realm_bg.png',
  music: 'mysterious_depths.mp3',
  steps: [
    { type: 'setBackground', uri: 'nexus_chamber.png', transition: 'fade' },
    { type: 'playMusic', uri: 'nexus_theme.mp3', loop: true, fadeIn: true },
    { type: 'showPortrait', side: 'right', uri: 'archivist_portrait.png', animation: 'slideIn' },
    
    { type: 'say', speaker: 'Ancient Archivist', text: 'Summoner... at last, you have come to the Nexus.' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'The balance between the four realms has been shattered. Dark energies corrupt the elemental flows.' },
    
    { type: 'setBackground', uri: 'water_realm_corruption.png', transition: 'fade' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'The Water Realm suffers most. Its creatures cry out in anguish as their essence is drained.' },
    
    { type: 'choice', choices: [
      { id: 'what_happened', text: 'What caused this corruption?', goto: 'corruption_explanation' },
      { id: 'how_help', text: 'How can I help?', goto: 'mission_explanation' },
      { id: 'why_me', text: 'Why was I chosen?', goto: 'chosen_explanation' }
    ]},
    
    { type: 'label', name: 'corruption_explanation' },
    { type: 'showPortrait', side: 'left', uri: 'shadow_figure.png', animation: 'fadeIn' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'Ancient beings known as the Void Seekers have awakened from their eternal slumber.' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'They consume elemental energy to fuel their return to the mortal realm.' },
    { type: 'hidePortrait', side: 'left', animation: 'fadeOut' },
    { type: 'goto', label: 'mission_explanation' },
    
    { type: 'label', name: 'chosen_explanation' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'Your spirit resonates with all four elements equally - a rare gift.' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'Only one who can command creatures from all realms can stand against this darkness.' },
    { type: 'goto', label: 'mission_explanation' },
    
    { type: 'label', name: 'mission_explanation' },
    { type: 'setBackground', uri: 'water_realm_entrance.png', transition: 'fade' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'You must journey to each realm and restore their elemental cores.' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'Begin in the Water Realm. Seek out Selel, the Guardian of Tides.' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'But beware - the corruption has twisted many creatures. They will test your resolve.' },
    
    { type: 'showPortrait', side: 'left', uri: 'selel_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'Selel (Vision)', text: 'Summoner... I sense your approach. My realm\'s creatures will aid you, but first you must prove your worth.' },
    { type: 'hidePortrait', side: 'left', animation: 'fadeOut' },
    
    { type: 'say', speaker: 'Ancient Archivist', text: 'The path ahead is perilous, but the Nexus believes in your strength.' },
    { type: 'say', speaker: 'Ancient Archivist', text: 'Go now. The Water Realm awaits your first trial.' },
    
    { type: 'setFlag', key: 'story_chapter_1_intro_completed', value: true },
    { type: 'hidePortrait', side: 'right', animation: 'slideOut' },
    { type: 'stopMusic', fadeOut: true },
    { type: 'end' }
  ],
  priority: 50

   */
};

// Pre-Battle Scene - First Water Realm Battle
export const SCENE_FIRST_WATER_BATTLE: SceneSpec = {
  /*
  id: 'story_water_battle_1_pre',
  version: 1,
  title: 'Corrupted Waters',
  description: 'Encounter with the first corrupted water creature',
  triggers: [
    { type: 'onBattleStart', chapterId: 1, battleId: 'water_1' }
  ],
  conditions: {
    flags: { 'story_water_battle_1_pre_completed': false }
  },
  backgroundImage: 'misty_waterfall.png',
  music: 'tension_waters.mp3',
  steps: [
    { type: 'setBackground', uri: 'corrupted_pool.png', transition: 'fade' },
    { type: 'playMusic', uri: 'corrupted_waters.mp3', loop: true },
    
    { type: 'say', speaker: 'Narrator', text: 'As you approach the first sacred pool, the water turns murky and dark.' },
    { type: 'showPortrait', side: 'left', uri: 'corrupted_nixeth.png', animation: 'slideIn' },
    { type: 'say', speaker: 'Corrupted Nixeth', text: '*gurgling sounds* The darkness... it calls to us... Join us in the depths...' },
    
    { type: 'choice', choices: [
      { id: 'try_reason', text: 'Try to reason with it', goto: 'reason_attempt' },
      { id: 'prepare_battle', text: 'Prepare for battle', goto: 'battle_ready' },
      { id: 'retreat', text: 'Step back cautiously', goto: 'cautious_approach' }
    ]},
    
    { type: 'label', name: 'reason_attempt' },
    { type: 'say', speaker: 'You', text: 'I\'m here to help! The corruption can be cleansed!' },
    { type: 'say', speaker: 'Corrupted Nixeth', text: '*hisses* Help? We are... beyond help... Only the void remains...' },
    { type: 'setFlag', key: 'attempted_reasoning', value: true },
    { type: 'goto', label: 'battle_inevitable' },
    
    { type: 'label', name: 'cautious_approach' },
    { type: 'say', speaker: 'Narrator', text: 'You step back, sensing the creature\'s pain beneath the corruption.' },
    { type: 'say', speaker: 'Corrupted Nixeth', text: 'Fear... yes... fear the truth of what we have become...' },
    { type: 'setFlag', key: 'showed_caution', value: true },
    { type: 'goto', label: 'battle_inevitable' },
    
    { type: 'label', name: 'battle_ready' },
    { type: 'say', speaker: 'You', text: 'If battle is the only way to free you from this corruption, so be it!' },
    { type: 'setFlag', key: 'battle_determined', value: true },
    { type: 'goto', label: 'battle_inevitable' },
    
    { type: 'label', name: 'battle_inevitable' },
    { type: 'say', speaker: 'Corrupted Nixeth', text: 'Then face us... and join our eternal suffering...' },
    { type: 'say', speaker: 'Narrator', text: 'The corrupted creature attacks! You must defend yourself and try to purify it through battle.' },
    
    { type: 'setFlag', key: 'story_water_battle_1_pre_completed', value: true },
    { type: 'hidePortrait', side: 'left', animation: 'fadeOut' },
    { type: 'triggerBattle', chapterId: 1, battleId: 'water_1' }
  ],
  priority: 45
   */
};

// Post-Battle Scene - After first victory
export const SCENE_FIRST_WATER_VICTORY: SceneSpec = {
  /*
  id: 'story_water_battle_1_post',
  version: 1,
  title: 'Purification',
  description: 'The creature is cleansed of corruption',
  triggers: [
    { type: 'onBattleEnd', result: 'win' }
  ],
  conditions: {
    flags: { 
      'story_water_battle_1_pre_completed': true,
      'story_water_battle_1_post_completed': false 
    }
  },
  backgroundImage: 'cleansed_pool.png',
  music: 'gentle_waters.mp3',
  steps: [
    { type: 'setBackground', uri: 'purified_pool.png', transition: 'fade' },
    { type: 'playMusic', uri: 'healing_waters.mp3', loop: true, fadeIn: true },
    
    { type: 'say', speaker: 'Narrator', text: 'As the battle ends, the dark energy dissipates like morning mist.' },
    { type: 'showPortrait', side: 'left', uri: 'nixeth_pure.png', animation: 'fadeIn' },
    { type: 'say', speaker: 'Nixeth', text: 'The... the darkness is gone... Thank you, brave summoner.' },
    
    { type: 'if', flag: 'attempted_reasoning', then: 'reasoning_response', else: 'standard_response' },
    
    { type: 'label', name: 'reasoning_response' },
    { type: 'say', speaker: 'Nixeth', text: 'Your words reached me even in the depths of corruption. Such compassion is rare.' },
    { type: 'goto', label: 'continue_story' },
    
    { type: 'label', name: 'standard_response' },
    { type: 'say', speaker: 'Nixeth', text: 'Your strength has freed me from the void\'s grip. I am forever in your debt.' },
    
    { type: 'label', name: 'continue_story' },
    { type: 'say', speaker: 'Nixeth', text: 'The corruption spreads deeper into our realm. You must reach the Temple of Tides.' },
    { type: 'say', speaker: 'Nixeth', text: 'Selel awaits there, but the path is guarded by more corrupted souls.' },
    
    { type: 'imageOverlay', uri: 'water_essence.png', x: 100, y: 100, width: 150, height: 150, duration: 3000 },
    { type: 'say', speaker: 'Nixeth', text: 'Take this essence of pure water. It will aid you on your journey.' },
    { type: 'say', speaker: 'Narrator', text: 'You gained: Water Essence! This will help you in future water battles.' },
    
    { type: 'say', speaker: 'Nixeth', text: 'Go now, while hope still remains. The realm depends on your success.' },
    
    { type: 'setFlag', key: 'story_water_battle_1_post_completed', value: true },
    { type: 'setFlag', key: 'has_water_essence', value: true },
    { type: 'setProgress', key: 'water_realm_progress', value: 1 },
    { type: 'hidePortrait', side: 'left', animation: 'slideOut' },
    { type: 'stopMusic', fadeOut: true },
    { type: 'end' }
  ],
  priority: 45
   */
};

// Mid-Chapter Story Scene
export const SCENE_WATER_TEMPLE_APPROACH: SceneSpec = {
  /*
  id: 'story_water_temple_approach',
  version: 1,
  title: 'The Temple of Tides',
  description: 'Approaching Selel\'s temple',
  triggers: [
    { type: 'onStoryProgress', chapterId: 1, battleId: 'water_3' }
  ],
  conditions: {
    flags: { 'story_water_temple_approach_completed': false },
    progress: { 'water_realm_progress': 2 }
  },
  backgroundImage: 'water_temple_exterior.png',
  music: 'sacred_waters.mp3',
  steps: [
    { type: 'setBackground', uri: 'temple_of_tides.png', transition: 'fade' },
    { type: 'playMusic', uri: 'temple_theme.mp3', loop: true, fadeIn: true },
    
    { type: 'say', speaker: 'Narrator', text: 'After cleansing several corrupted pools, you arrive at the ancient Temple of Tides.' },
    { type: 'say', speaker: 'Narrator', text: 'The structure rises from the water itself, its crystalline walls pulsing with inner light.' },
    
    { type: 'showPortrait', side: 'right', uri: 'temple_guardian.png', animation: 'slideIn' },
    { type: 'say', speaker: 'Temple Guardian', text: 'Hold, summoner. To enter the sacred temple, you must prove your mastery over water.' },
    { type: 'say', speaker: 'Temple Guardian', text: 'Lady Selel has been weakened by the corruption spreading through our realm.' },
    
    { type: 'choice', choices: [
      { id: 'how_prove', text: 'How do I prove my mastery?', goto: 'trial_explanation' },
      { id: 'selel_condition', text: 'What happened to Selel?', goto: 'selel_condition' },
      { id: 'ready_trial', text: 'I\'m ready for any trial', goto: 'accept_trial' }
    ]},
    
    { type: 'label', name: 'selel_condition' },
    { type: 'say', speaker: 'Temple Guardian', text: 'The corruption has created a psychic link. Each tainted creature weakens her further.' },
    { type: 'say', speaker: 'Temple Guardian', text: 'Your cleansing efforts have helped, but the source must be found and destroyed.' },
    { type: 'goto', label: 'trial_explanation' },
    
    { type: 'label', name: 'trial_explanation' },
    { type: 'say', speaker: 'Temple Guardian', text: 'Face the Trial of Depths. Defeat the temple\'s guardian beasts.' },
    { type: 'say', speaker: 'Temple Guardian', text: 'They are not corrupted, but they will test your resolve and skill.' },
    { type: 'goto', label: 'accept_trial' },
    
    { type: 'label', name: 'accept_trial' },
    { type: 'say', speaker: 'Temple Guardian', text: 'Then enter, brave one. May the tides carry you to victory.' },
    { type: 'say', speaker: 'Narrator', text: 'The temple doors open with a sound like rushing waterfalls.' },
    
    { type: 'setFlag', key: 'story_water_temple_approach_completed', value: true },
    { type: 'hidePortrait', side: 'right', animation: 'slideOut' },
    { type: 'end' }
  ],
  priority: 40
   */
};

// Chapter Boss Introduction
export const SCENE_SELEL_ENCOUNTER: SceneSpec = {
  /*
  id: 'story_selel_encounter',
  version: 1,
  title: 'The Guardian of Tides',
  description: 'Meeting Selel, the Water Realm guardian',
  triggers: [
    { type: 'onBattleStart', chapterId: 1, battleId: 'selel_boss' }
  ],
  conditions: {
    flags: { 'story_selel_encounter_completed': false }
  },
  backgroundImage: 'temple_inner_sanctum.png',
  music: 'selel_theme.mp3',
  steps: [
    { type: 'setBackground', uri: 'selel_chamber.png', transition: 'fade' },
    { type: 'playMusic', uri: 'guardian_theme.mp3', loop: true, fadeIn: true },
    
    { type: 'say', speaker: 'Narrator', text: 'In the heart of the temple, you find Selel, Guardian of Tides.' },
    { type: 'showPortrait', side: 'left', uri: 'selel_portrait.png', animation: 'slideIn' },
    { type: 'say', speaker: 'Selel', text: 'So... you are the one the Nexus has chosen. I sense great potential within you.' },
    
    { type: 'say', speaker: 'Selel', text: 'But potential alone will not save the realms. You must have the strength to face true darkness.' },
    { type: 'say', speaker: 'Selel', text: 'I will test you myself. Do not hold back - I am not so easily defeated!' },
    
    { type: 'choice', choices: [
      { id: 'honor_fight', text: 'I accept your challenge with honor', goto: 'honorable_response' },
      { id: 'question_necessary', text: 'Is this fight really necessary?', goto: 'questioning_response' },
      { id: 'confident', text: 'I\'ll prove my strength to you!', goto: 'confident_response' }
    ]},
    
    { type: 'label', name: 'honorable_response' },
    { type: 'say', speaker: 'Selel', text: 'Your humility serves you well. A true guardian fights not for glory, but for duty.' },
    { type: 'setFlag', key: 'selel_impressed_honor', value: true },
    { type: 'goto', label: 'battle_begins' },
    
    { type: 'label', name: 'questioning_response' },
    { type: 'say', speaker: 'Selel', text: 'Wisdom in questioning, but some truths can only be learned through combat.' },
    { type: 'setFlag', key: 'selel_noted_wisdom', value: true },
    { type: 'goto', label: 'battle_begins' },
    
    { type: 'label', name: 'confident_response' },
    { type: 'say', speaker: 'Selel', text: 'Confidence is good, but beware of arrogance. The water teaches us humility.' },
    { type: 'setFlag', key: 'selel_warned_pride', value: true },
    { type: 'goto', label: 'battle_begins' },
    
    { type: 'label', name: 'battle_begins' },
    { type: 'say', speaker: 'Selel', text: 'Come then! Let the tides test your resolve!' },
    { type: 'say', speaker: 'Narrator', text: 'Selel raises her staff, and the chamber fills with swirling water. The battle begins!' },
    
    { type: 'setFlag', key: 'story_selel_encounter_completed', value: true },
    { type: 'hidePortrait', side: 'left', animation: 'slideOut' },
    { type: 'triggerBattle', chapterId: 1, battleId: 'selel_boss' }
  ],
  priority: 35
   */
};

// Chapter Completion
export const SCENE_CHAPTER_1_COMPLETION: SceneSpec = {
  /*
  id: 'story_chapter_1_completion',
  version: 1,
  title: 'Water Realm Restored',
  description: 'Selel is defeated and the water realm is cleansed',
  triggers: [
    { type: 'onBattleEnd', result: 'win' }
  ],
  conditions: {
    flags: { 
      'story_selel_encounter_completed': true,
      'story_chapter_1_completion_completed': false 
    }
  },
  backgroundImage: 'restored_temple.png',
  music: 'victory_waters.mp3',
  steps: [
    { type: 'setBackground', uri: 'selel_chamber_purified.png', transition: 'fade' },
    { type: 'playMusic', uri: 'realm_restored.mp3', loop: true, fadeIn: true },
    
    { type: 'say', speaker: 'Narrator', text: 'As Selel acknowledges your victory, the temple fills with pure, healing light.' },
    { type: 'showPortrait', side: 'left', uri: 'selel_smiling.png', animation: 'fadeIn' },
    { type: 'say', speaker: 'Selel', text: 'Magnificent! You have proven yourself worthy, summoner.' },
    
    { type: 'if', flag: 'selel_impressed_honor', then: 'honor_ending', else: 'standard_ending' },
    
    { type: 'label', name: 'honor_ending' },
    { type: 'say', speaker: 'Selel', text: 'Your honorable spirit reminds me why we guardians exist - to protect, not to dominate.' },
    { type: 'goto', label: 'realm_cleansing' },
    
    { type: 'label', name: 'standard_ending' },
    { type: 'say', speaker: 'Selel', text: 'Your strength will be needed in the trials ahead.' },
    
    { type: 'label', name: 'realm_cleansing' },
    { type: 'imageOverlay', uri: 'water_core_restored.png', x: 150, y: 150, width: 200, height: 200, duration: 5000 },
    { type: 'say', speaker: 'Selel', text: 'Behold! The Water Core is restored!' },
    { type: 'say', speaker: 'Narrator', text: 'Throughout the realm, corrupted pools clear and tainted creatures are healed.' },
    
    { type: 'say', speaker: 'Selel', text: 'But this is only the beginning. Three more realms suffer under the void\'s influence.' },
    { type: 'say', speaker: 'Selel', text: 'Take this blessing of the waters. It will aid you in the Fire Realm.' },
    
    { type: 'say', speaker: 'Narrator', text: 'You gained: Blessing of Tides! This will help counter fire-based attacks.' },
    { type: 'say', speaker: 'Selel', text: 'Go now to the Fire Realm. Seek Solen, the Solar Guardian. Tell him Selel sends her regards.' },
    
    { type: 'choice', choices: [
      { id: 'thank_selel', text: 'Thank you for your guidance', goto: 'grateful_response' },
      { id: 'ask_advice', text: 'Any advice for the Fire Realm?', goto: 'advice_response' },
      { id: 'ready_next', text: 'I\'m ready for the next challenge', goto: 'determined_response' }
    ]},
    
    { type: 'label', name: 'grateful_response' },
    { type: 'say', speaker: 'Selel', text: 'It is I who should thank you. The Water Realm owes you an eternal debt.' },
    { type: 'goto', label: 'farewell' },
    
    { type: 'label', name: 'advice_response' },
    { type: 'say', speaker: 'Selel', text: 'Fire creatures are passionate but proud. Show strength, but also respect for their traditions.' },
    { type: 'setFlag', key: 'selel_fire_advice', value: true },
    { type: 'goto', label: 'farewell' },
    
    { type: 'label', name: 'determined_response' },
    { type: 'say', speaker: 'Selel', text: 'Your determination will serve you well. May the tides carry you safely.' },
    { type: 'goto', label: 'farewell' },
    
    { type: 'label', name: 'farewell' },
    { type: 'say', speaker: 'Selel', text: 'Farewell, champion of the Nexus. The balance of all worlds rests in your hands.' },
    
    { type: 'setFlag', key: 'story_chapter_1_completion_completed', value: true },
    { type: 'setFlag', key: 'has_water_blessing', value: true },
    { type: 'setProgress', key: 'completed_realms', value: 1 },
    { type: 'hidePortrait', side: 'left', animation: 'slideOut' },
    { type: 'stopMusic', fadeOut: true },
    { type: 'end' }
  ],
  priority: 30
   */
};

// Export all story scenes
export const ALL_STORY_SCENES: SceneSpec[] = [
  SCENE_CHAPTER_1_INTRO,
  SCENE_FIRST_WATER_BATTLE,
  SCENE_FIRST_WATER_VICTORY,
  SCENE_WATER_TEMPLE_APPROACH,
  SCENE_SELEL_ENCOUNTER,
  SCENE_CHAPTER_1_COMPLETION,
];