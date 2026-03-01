import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CardSize = 'small' | 'normal';

interface SettingsContextType {
  cardSize: CardSize;
  setCardSize: (size: CardSize) => void;
  showBattleLog: boolean;
  setShowBattleLog: (show: boolean) => void;
  screenShake: boolean;
  setScreenShake: (enabled: boolean) => void;
  turnBanner: boolean;
  setTurnBanner: (enabled: boolean) => void;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = '@creature_nexus_settings';

interface Settings {
  cardSize: CardSize;
  showBattleLog: boolean;
  screenShake: boolean;
  turnBanner: boolean;
  locale?: string;
}

const defaultSettings: Settings = {
  cardSize: 'small', // Default to small for better UX
  showBattleLog: false, // Disabled by default
  screenShake: true, // Enabled by default
  turnBanner: true, // Enabled by default
  locale: 'en'
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from storage on app start
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const merged = { ...defaultSettings, ...parsed } as Settings;
        try {
          const { i18n } = await import('@/utils/i18n');
          await i18n.setLocale(merged.locale || 'en');
        } catch (error) {
          if (__DEV__) {
            console.warn('Failed to apply stored locale during settings load:', error);
          }
        }
        setSettings(merged);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading settings:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving settings:', error);
      }
    }
  };

  const setCardSize = (size: CardSize) => {
    const newSettings = { ...settings, cardSize: size };
    saveSettings(newSettings);
  };

  const setShowBattleLog = (show: boolean) => {
    const newSettings = { ...settings, showBattleLog: show };
    saveSettings(newSettings);
  };

  const setScreenShake = (enabled: boolean) => {
    const newSettings = { ...settings, screenShake: enabled };
    saveSettings(newSettings);
  };

  const setTurnBanner = (enabled: boolean) => {
    const newSettings = { ...settings, turnBanner: enabled };
    saveSettings(newSettings);
  };

  const setLocale = async (locale: string) => {
    const newSettings = { ...settings, locale };
    // Update i18n first to ensure next render reflects the new language immediately
    try {
      const { i18n } = await import('@/utils/i18n');
      await i18n.setLocale(locale);
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to switch locale in settings context:', error);
      }
    }
    saveSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{
      cardSize: settings.cardSize,
      setCardSize,
      showBattleLog: settings.showBattleLog,
      setShowBattleLog,
      screenShake: settings.screenShake,
      setScreenShake,
      turnBanner: settings.turnBanner,
      setTurnBanner,
      locale: settings.locale || 'en',
      setLocale,
      loading,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
