import { useEffect, useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { soundManager, MusicType } from '../utils/game/soundManager';

// Re-export MusicType for convenience
export { MusicType } from '../utils/game/soundManager';

interface UseAudioOptions {
  autoPlay?: boolean;
  musicType?: MusicType;
}

interface AudioHookReturn {
  isPlaying: boolean;
  currentMusicType: MusicType | null;
  hasUserInteracted: boolean;
  playMusic: (type: MusicType) => Promise<void>;
  stopMusic: () => Promise<void>;
  pauseMusic: () => Promise<void>;
  resumeMusic: () => Promise<void>;
  setMusicVolume: (volume: number) => Promise<void>;
  setSoundEffectsVolume: (volume: number) => Promise<void>;
  setMusicEnabled: (enabled: boolean) => Promise<void>;
  setSoundEffectsEnabled: (enabled: boolean) => Promise<void>;
  enableAudio: () => Promise<void>;
  settings: {
    musicEnabled: boolean;
    musicVolume: number;
    soundEffectsEnabled: boolean;
    soundEffectsVolume: number;
  };
}

export const useAudio = (options: UseAudioOptions = {}): AudioHookReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMusicType, setCurrentMusicType] = useState<MusicType | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [settings, setSettings] = useState(soundManager.getSettings());

  // Update state when sound manager changes
  const updateState = useCallback(() => {
    setIsPlaying(soundManager.isMusicPlaying());
    setCurrentMusicType(soundManager.getCurrentMusicType());
    setHasUserInteracted(soundManager.hasUserInteracted());
    setSettings(soundManager.getSettings());
  }, []);

  const playMusic = useCallback(async (type: MusicType) => {
    await soundManager.playMusic(type);
    updateState();
  }, [updateState]);

  const stopMusic = useCallback(async () => {
    await soundManager.stopMusic();
    updateState();
  }, [updateState]);

  const pauseMusic = useCallback(async () => {
    await soundManager.pauseMusic();
    updateState();
  }, [updateState]);

  const resumeMusic = useCallback(async () => {
    await soundManager.resumeMusic();
    updateState();
  }, [updateState]);

  const setMusicVolume = useCallback(async (volume: number) => {
    await soundManager.setMusicVolume(volume);
    updateState();
  }, [updateState]);

  const setSoundEffectsVolume = useCallback(async (volume: number) => {
    await soundManager.setSoundEffectsVolume(volume);
    updateState();
  }, [updateState]);

  const setMusicEnabled = useCallback(async (enabled: boolean) => {
    await soundManager.setMusicEnabled(enabled);
    updateState();
  }, [updateState]);

  const setSoundEffectsEnabled = useCallback(async (enabled: boolean) => {
    await soundManager.setSoundEffectsEnabled(enabled);
    updateState();
  }, [updateState]);

  const enableAudio = useCallback(async () => {
    await soundManager.enableAudio();
    updateState();
  }, [updateState]);

  // Handle app state changes (pause/resume music when app goes to background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'background') {
        await pauseMusic();
      } else if (nextAppState === 'active' && currentMusicType) {
        await resumeMusic();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [pauseMusic, resumeMusic, currentMusicType]);

  // Auto-play music if specified
  useEffect(() => {
    if (options.autoPlay && options.musicType && !currentMusicType) {
      playMusic(options.musicType);
    }
  }, [options.autoPlay, options.musicType, currentMusicType, playMusic]);

  // Initial state update
  useEffect(() => {
    updateState();
  }, [updateState]);

  return {
    isPlaying,
    currentMusicType,
    hasUserInteracted,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    setMusicVolume,
    setSoundEffectsVolume,
    setMusicEnabled,
    setSoundEffectsEnabled,
    enableAudio,
    settings
  };
};