import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export enum MusicType {
  GENERAL = 'general',
  BATTLE = 'battle'
}

// Sound effect keys — sounds that don't have an asset yet will be silently skipped
export const SFX = {
  IMPACT: 'impact',
  CARD_PLAY: 'card_play',
  CARD_DEATH: 'card_death',
  CARD_RETIRE: 'card_retire',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  TURN_END: 'turn_end',
  ENERGY_GAIN: 'energy_gain',
  SPELL_CAST: 'spell_cast',
  ATTACK_FIRE: 'attack_fire',
  ATTACK_WATER: 'attack_water',
  ATTACK_AIR: 'attack_air',
  ATTACK_EARTH: 'attack_earth',
} as const;

interface AudioSettings {
  musicEnabled: boolean;
  musicVolume: number;
  soundEffectsEnabled: boolean;
  soundEffectsVolume: number;
}

class SoundManager {
  // Sound effects
  private sounds: Map<string, AudioPlayer> = new Map();

  // Background music
  private currentMusicPlayer: AudioPlayer | null = null;
  private currentMusicType: MusicType | null = null;
  private isLoadingMusic = false;
  private pendingMusicType: MusicType | null = null;
  private userHasInteracted = false;
  private fadeInterval: any | null = null;
  private readonly DEFAULT_FADE_MS = 800;

  private settings: AudioSettings = {
    musicEnabled: true,
    musicVolume: 0.5,
    soundEffectsEnabled: true,
    soundEffectsVolume: 0.7
  };

  // Music assets
  private musicAssets = {
    [MusicType.GENERAL]: require('../../assets/audio/general-background.mp3'),
    [MusicType.BATTLE]: require('../../assets/audio/battle-background.mp3')
  };

  constructor() {
    this.loadSettings();
    this.setupUserInteractionHandler();
  }

  private setupUserInteractionHandler() {
    // Listen for user interactions to enable audio
    const handleUserInteraction = () => {
      this.userHasInteracted = true;

      // If there's pending music, try to play it
      if (this.pendingMusicType && this.settings.musicEnabled) {
        this.playMusic(this.pendingMusicType);
        this.pendingMusicType = null;
      }

      // Remove listeners after first interaction
      if (typeof document !== 'undefined') {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      }
    };

    // Add event listeners for web only
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      document.addEventListener('keydown', handleUserInteraction, { once: true });
    } else {
      // On mobile platforms, user interaction is not required for audio
      this.userHasInteracted = true;
    }
  }

  private async loadSettings() {
    try {
      const storedSettings = await AsyncStorage.getItem('audio-settings');
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load audio settings:', error);
      }
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem('audio-settings', JSON.stringify(this.settings));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save audio settings:', error);
      }
    }
  }

  // === SOUND EFFECTS ===
  loadSound(name: string, source: any): void {
    try {
      const player = createAudioPlayer(source);
      player.volume = this.settings.soundEffectsVolume;
      this.sounds.set(name, player);
    } catch (error) {
      if (__DEV__) {
        console.warn(`Failed to load sound ${name}:`, error);
      }
    }
  }

  playSound(name: string): void {
    if (!this.settings.soundEffectsEnabled) return;

    try {
      const player = this.sounds.get(name);
      if (player) {
        // Reset to beginning and play
        player.seekTo(0);

        // For sound effects, try to play but don't fail silently
        try {
          player.play();
        } catch (playError: any) {
          if (playError.name === 'NotAllowedError' || playError.message?.includes('user agent')) {
            // Sound effects blocked by browser - this is normal for web
            if (__DEV__) {
              console.log(`Sound effect "${name}" blocked - user interaction required`);
            }
          } else {
            throw playError;
          }
        }
      } else {
        // Sound not loaded yet — this is expected for SFX keys without assets
        if (__DEV__) {
          console.warn(`Sound ${name} not found`);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`Failed to play sound ${name}:`, error);
      }
    }
  }

  // === BACKGROUND MUSIC ===
  async playMusic(type: MusicType, forceRestart = false): Promise<void> {
    if (__DEV__) {
      console.log(`SoundManager: playMusic(${type}), current: ${this.currentMusicType}, enabled: ${this.settings.musicEnabled}`);
    }

    if (!this.settings.musicEnabled) return;

    // Don't restart the same music unless forced
    if (this.currentMusicType === type && this.currentMusicPlayer && !forceRestart) {
      if (__DEV__) {
        console.log(`SoundManager: Same music type (${type}) already playing, skipping`);
      }
      return;
    }

    // If user hasn't interacted yet, store the request for later
    if (!this.userHasInteracted) {
      this.pendingMusicType = type;
      if (__DEV__) {
        console.log('Audio playback requires user interaction - music will start after user interaction');
      }
      return;
    }

    if (this.isLoadingMusic) return;
    this.isLoadingMusic = true;

    try {
      // Prepare new player for crossfade
      const newPlayer = createAudioPlayer(this.musicAssets[type]);
      const targetVolume = this.settings.musicVolume;
      // Start at 0 volume to fade-in
      newPlayer.volume = 0;

      // Loop if supported
      try {
        // @ts-ignore - Loop might not be in types for AudioPlayer
        newPlayer.loop = true;
      } catch {}

      // Start playing new track
      await this.safePlay(newPlayer);

      const oldPlayer = this.currentMusicPlayer;
      // Immediately set current to new to avoid race conditions during fade-in
      this.currentMusicPlayer = newPlayer;
      this.currentMusicType = type;
      const fadeMs = this.DEFAULT_FADE_MS;

      // Clear any existing fades
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }

      if (oldPlayer) {
        // Crossfade from old to new
        let startOldVol = targetVolume;
        try { startOldVol = (oldPlayer as any).volume ?? targetVolume; } catch {}
        const steps = Math.max(1, Math.floor(fadeMs / 50));
        let i = 0;
        this.fadeInterval = setInterval(() => {
          i += 1;
          const t = Math.min(1, i / steps);
          try { newPlayer.volume = t * targetVolume; } catch {}
          try { oldPlayer.volume = (1 - t) * startOldVol; } catch {}
          if (t >= 1) {
            if (this.fadeInterval) {
              clearInterval(this.fadeInterval);
              this.fadeInterval = null;
            }
            try {
              oldPlayer.pause();
              oldPlayer.release();
            } catch {}
          }
        }, 50);
      } else {
        // No previous music, simple fade-in
        if (targetVolume <= 0) {
          // Already set current above
        } else {
          const steps = Math.max(1, Math.floor(fadeMs / 50));
          let i = 0;
          this.fadeInterval = setInterval(() => {
            i += 1;
            const t = Math.min(1, i / steps);
            try { newPlayer.volume = t * targetVolume; } catch {}
            if (t >= 1) {
              if (this.fadeInterval) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
              }
              // Fade complete
            }
          }, 50);
        }
      }

    } catch (error) {
      if (__DEV__) {
        console.error('Failed to play music:', error);
      }
    } finally {
      this.isLoadingMusic = false;
    }
  }

  private async safePlay(player: AudioPlayer): Promise<void> {
    try {
      player.play();
      // Successful play means audio context is unlocked (especially on web)
      this.userHasInteracted = true;
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.message?.includes('user agent') || error.message?.includes('user denied')) {
        // User interaction required - this is normal on web
        this.userHasInteracted = false;
        if (__DEV__) {
          console.warn('Audio playback blocked - waiting for user interaction');
        }
        throw error;
      } else {
        // Other audio error
        throw error;
      }
    }
  }

  async stopMusic(): Promise<void> {
    if (this.currentMusicPlayer) {
      try {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
        this.currentMusicPlayer.pause();
        this.currentMusicPlayer.release();
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to stop music:', error);
        }
      }
      this.currentMusicPlayer = null;
      this.currentMusicType = null;
    }
  }

  async pauseMusic(): Promise<void> {
    if (this.currentMusicPlayer) {
      try {
        this.currentMusicPlayer.pause();
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to pause music:', error);
        }
      }
    }
  }

  async resumeMusic(): Promise<void> {
    if (this.currentMusicPlayer && this.settings.musicEnabled) {
      try {
        this.currentMusicPlayer.play();
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to resume music:', error);
        }
      }
    }
  }

  // === SETTINGS ===
  async setMusicVolume(volume: number): Promise<void> {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    await this.saveSettings();

    if (this.currentMusicPlayer) {
      try {
        this.currentMusicPlayer.volume = this.settings.musicVolume;
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to set music volume:', error);
        }
      }
    }
  }

  async setSoundEffectsVolume(volume: number): Promise<void> {
    this.settings.soundEffectsVolume = Math.max(0, Math.min(1, volume));
    await this.saveSettings();

    // Update volume for all loaded sound effects
    for (const [name, player] of this.sounds) {
      try {
        player.volume = this.settings.soundEffectsVolume;
      } catch (error) {
        if (__DEV__) {
          console.error(`Failed to set volume for sound ${name}:`, error);
        }
      }
    }
  }

  async setMusicEnabled(enabled: boolean): Promise<void> {
    this.settings.musicEnabled = enabled;
    await this.saveSettings();

    if (!enabled) {
      // Stop current music and clear pending music
      await this.stopMusic();
      this.pendingMusicType = null;
    } else {
      // If enabling music, try to resume the last played type or start general music
      const musicToPlay = this.currentMusicType || this.pendingMusicType || MusicType.GENERAL;
      await this.playMusic(musicToPlay);
    }
  }

  async setSoundEffectsEnabled(enabled: boolean): Promise<void> {
    this.settings.soundEffectsEnabled = enabled;
    await this.saveSettings();
  }

  // === GETTERS ===
  getCurrentMusicType(): MusicType | null {
    return this.currentMusicType;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  isMusicPlaying(): boolean {
    return this.currentMusicPlayer !== null && this.settings.musicEnabled;
  }

  hasUserInteracted(): boolean {
    return this.userHasInteracted;
  }

  // Method to manually trigger audio context unlock (call this on user interaction)
  async enableAudio(): Promise<void> {
    this.userHasInteracted = true;

    // If there's pending music and no music is currently playing, try to play it
    if (this.pendingMusicType && this.settings.musicEnabled && !this.currentMusicPlayer) {
      await this.playMusic(this.pendingMusicType);
      this.pendingMusicType = null;
    } else {
      // Clear pending music if something is already playing
      this.pendingMusicType = null;
    }
  }

  unloadAllSounds(): void {
    for (const [name, player] of this.sounds) {
      try {
        player.release();
      } catch (error) {
        if (__DEV__) {
          console.warn(`Failed to unload sound ${name}:`, error);
        }
      }
    }
    this.sounds.clear();
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Initialize sounds — only loads assets that exist, missing SFX keys are silently skipped at play time
export const initializeSounds = (): void => {
  try {
    soundManager.loadSound(SFX.IMPACT, require('../../assets/impact.wav'));
    // Future SFX assets will be loaded here as they become available:
    // soundManager.loadSound(SFX.CARD_PLAY, require('../../assets/audio/sfx/card_play.wav'));
    // soundManager.loadSound(SFX.CARD_DEATH, require('../../assets/audio/sfx/card_death.wav'));
    // etc.
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to initialize sounds:', error);
    }
  }
};

// Convenience function to play impact sound
export const playImpactSound = (): void => {
  soundManager.playSound(SFX.IMPACT);
};