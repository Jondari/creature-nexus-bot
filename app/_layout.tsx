import { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Platform } from 'react-native';

// Load Skia CanvasKit on web before any Skia component renders
const LoadSkiaWeb = Platform.OS === 'web'
  ? require('@shopify/react-native-skia/lib/module/web').LoadSkiaWeb
  : null;

// Providers are facades that conditionally load Firebase or Local implementations
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DeckProvider } from '@/context/DeckContext';
import { StoryModeProvider } from '@/context/StoryModeContext';

import { SettingsProvider } from '@/context/SettingsContext';
import GlobalAlertProvider from '@/components/GlobalAlertProvider';
import { AnchorsProvider } from '@/context/AnchorsContext';
import { SceneManagerProvider } from '@/context/SceneManagerContext';
import ScenesRegistry from '@/components/ScenesRegistry';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { View, Text, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { SplashScreen } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
// Conditionally load react-native-purchases to avoid native module issues on web/demo
const Purchases = Platform.OS !== 'web' ? require('react-native-purchases').default : null;
const LOG_LEVEL = Platform.OS !== 'web' ? require('react-native-purchases').LOG_LEVEL : null;
import { useAudio, MusicType } from '@/hooks/useAudio';
import { AudioPermissionBanner } from '@/components/AudioPermissionBanner';
import { t } from '@/utils/i18n';
import { isDemoMode } from '@/config/localMode';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  // Skia CanvasKit must be loaded before any Skia Canvas renders on web
  const isWeb = Platform.OS === 'web';
  const [skiaReady, setSkiaReady] = useState(!isWeb);

  useEffect(() => {
    if (isWeb && LoadSkiaWeb) {
      LoadSkiaWeb().then(() => setSkiaReady(true));
    }
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  
  // Initialize background music
  const { playMusic } = useAudio();
  const pathname = usePathname();

  const router = useRouter();
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();

      // Determine music based on current route
      // Support both with and without group segments in pathname
      const battleRoutes = [
        '/quick-battle',
        '/story-battle',
        '/(tabs)/quick-battle',
        '/(tabs)/story-battle',
      ];
      const isBattle = battleRoutes.some((r) => pathname?.startsWith(r));

      playMusic(isBattle ? MusicType.BATTLE : MusicType.GENERAL);
      // First-run language selection
      (async () => {
        try {
          const storedLocale = await AsyncStorage.getItem('@locale');
          if (!storedLocale) {
            router.replace('/language');
          }
        } catch (error) {
          if (__DEV__) {
            console.warn('Failed to check stored locale during first launch tutorial redirect:', error);
          }
        }
      })();
    }
  }, [fontsLoaded, fontError, pathname, playMusic]);

  // Hide Android navigation bar
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBackgroundColorAsync('transparent');
    }
  }, []);

  // Configure RevenueCat (Android only, skip in demo mode)
  useEffect(() => {
    if (Platform.OS !== 'android' || isDemoMode || !Purchases) return;

    const initializeRevenueCat = async () => {
      try {
        const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

        if (!apiKey) {
          if (__DEV__) {
            console.warn('RevenueCat Android API key not found in environment variables');
          }
          return;
        }

        if (__DEV__ && LOG_LEVEL) {
          Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        }

        await Purchases.configure({ apiKey });

        if (__DEV__) {
          console.log('RevenueCat configured successfully');
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to configure RevenueCat:', error);
        }
      }
    };

    initializeRevenueCat();
  }, []);

  // Return null to keep splash screen visible while fonts or Skia load
  if ((!fontsLoaded && !fontError) || !skiaReady) {
    return null;
  }

  return (
    <GlobalAlertProvider>
      <SettingsProvider>
        <AuthProvider>
          {/* Inject scenes + anchors using the signed-in user id */}
          <SceneLayer>
            <DeckProvider>
              <StoryModeProvider>
                {/* Audio Permission Banner */}
                <AudioPermissionBanner />

                <ZoomWrapper>
                  <Stack screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: Colors.background.primary }
                  }}>
                    <Stack.Screen name="language" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" options={{ title: t('notFound.stackTitle') }} />
                  </Stack>
                  <StatusBar style="light" hidden={Platform.OS === 'android'} />
                </ZoomWrapper>

                {/* Animated Splash Screen */}
                {showAnimatedSplash && (
                  <AnimatedSplashScreen
                    duration={2500} // 2.5 seconds
                    onComplete={() => setShowAnimatedSplash(false)}
                  />
                )}
              </StoryModeProvider>
            </DeckProvider>
          </SceneLayer>
        </AuthProvider>
      </SettingsProvider>
    </GlobalAlertProvider>
  );
}

// Scenes + Anchors wrapper that binds to current user
const SceneLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  return (
    <AnchorsProvider>
      <SceneManagerProvider userId={user?.uid} ready={!loading} debugMode={true}>
        <ScenesRegistry />
        {children}
      </SceneManagerProvider>
    </AnchorsProvider>
  );
};

// Zoom wrapper that applies zoom on Android or Web responsive mode
const ZoomWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useWindowDimensions();

  // Get zoom scale from env or use 1 as default (no zoom)
  const zoomScale = parseFloat(process.env.EXPO_PUBLIC_ZOOM_SCALE || '1');

  // Apply zoom on Android or Web with mobile-sized screen (< 768px)
  const shouldZoom = Platform.OS === 'android' || (Platform.OS === 'web' && width < 768);

  // Calculate compensated dimensions in pixels
  const compensatedWidth = width / zoomScale;
  const compensatedHeight = height / zoomScale;

  const dynamicZoomStyle: ViewStyle = {
    width: compensatedWidth,
    height: compensatedHeight,
    transform: [{ scale: zoomScale }],
    transformOrigin: 'top left',
  };

  return (
    <View style={shouldZoom ? dynamicZoomStyle : styles.noZoomContainer}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
  },
  text: {
    color: Colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  noZoomContainer: {
    flex: 1,
  }
});
