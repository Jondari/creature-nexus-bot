import React from 'react';
import { Tabs } from 'expo-router';
import { PackageOpen, Box, User, Grid2x2 as Grid, Swords, Layers, ShoppingBag } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';
import { useSettings } from '@/context/SettingsContext';

export default function TabLayout() {
  // Subscribe to locale so tab labels update immediately on language change
  const { locale } = useSettings();
  return (
    <Tabs
      key={locale}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background.secondary,
          borderTopColor: Colors.background.secondary,
          height: 60,
        },
        tabBarActiveTintColor: Colors.accent[500],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, size }) => (
            <PackageOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: t('nav.collection'),
          tabBarIcon: ({ color, size }) => (
            <Grid size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: t('nav.store'),
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          title: t('nav.decks'),
          tabBarIcon: ({ color, size }) => (
            <Layers size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: t('nav.battle'),
          tabBarIcon: ({ color, size }) => (
            <Swords size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quick-battle"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="story-mode"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chapter-map"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="story-battle"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="battle-tutorial"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
