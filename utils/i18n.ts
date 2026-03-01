import AsyncStorage from '@react-native-async-storage/async-storage';
import enData from '../data/i18n_en.json';

type I18nKey = string;

class I18nManager {
  private data: Record<string, any> = enData as any;
  private locale: string = 'en';

  get(key: I18nKey, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.data;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if not found
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (params) {
      return this.interpolate(value, params);
    }

    return value;
  }

  private interpolate(text: string, params: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] || match;
    });
  }

  async setLocale(locale: string): Promise<void> {
    // Load locale data (static require to keep bundler happy)
    let data: any = enData;
    switch (locale) {
      case 'fr':
        data = (await import('../data/i18n_fr.json')).default;
        break;
      case 'en':
      default:
        data = enData;
        break;
    }
    this.locale = locale;
    this.data = data;
    try {
      await AsyncStorage.setItem('@locale', locale);
    } catch {}
  }

  getLocale(): string {
    return this.locale;
  }
}

export const i18n = new I18nManager();

export function t(key: I18nKey, params?: Record<string, string>): string {
  return i18n.get(key, params);
}

export async function initI18n(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem('@locale');
    const target = stored || 'en';
    await i18n.setLocale(target);
    return target;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to initialize locale from storage, falling back to en:', error);
    }
    await i18n.setLocale('en');
    return 'en';
  }
}
