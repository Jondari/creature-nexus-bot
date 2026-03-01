import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';
import { useRouter } from 'expo-router';
import { useSettings } from '@/context/SettingsContext';

export default function LanguageScreen() {
  const router = useRouter();
  const { setLocale } = useSettings();

  const choose = async (locale: 'en' | 'fr') => {
    await setLocale(locale);
    router.replace('/(auth)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('language.title')}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => choose('en')}>
          <Text style={styles.btnText}>{t('common.lang.english')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => choose('fr')}>
          <Text style={styles.btnText}>{t('common.lang.french')}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    color: Colors.text.primary,
    fontFamily: 'Poppins-Bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnPrimary: {
    backgroundColor: Colors.primary[600],
  },
  btnSecondary: {
    backgroundColor: Colors.accent[600],
  },
  btnText: {
    color: Colors.text.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
});
