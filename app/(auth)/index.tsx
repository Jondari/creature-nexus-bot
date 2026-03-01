import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, TextInput, Modal, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, LogIn } from 'lucide-react-native';
import { showErrorAlert } from '@/utils/alerts';
import Colors from '@/constants/Colors';
import LoadingOverlay from '@/components/LoadingOverlay';
import { t } from '@/utils/i18n';
import { isDemoMode } from '@/config/localMode';
import MonsterShowcaseAnimation from '@/components/Animation/MonsterShowcaseAnimation';

// Premium monster showcase images
const PREMIUM_MONSTERS = {
  // Mythic monsters
  Mythanor: require('../../assets/images/mythic/Mythanor.png'),
  Mythelgotn: require('../../assets/images/mythic/Mythelgorn.png'),
  Mytholzak: require('../../assets/images/mythic/Mytholzak.png'),
  Mythunden: require('../../assets/images/mythic/Mythunden.png'),
  Mythévor: require('../../assets/images/mythic/Mythévor.png'),
  // Legendary monsters
  Golrok: require('../../assets/images/legendary/Golrok.png'),
  Selel: require('../../assets/images/legendary/Selel.png'),
  Solen: require('../../assets/images/legendary/Solen.png'),
  Stonelorn: require('../../assets/images/legendary/Stonelorn.png'),
  Zephun: require('../../assets/images/legendary/Zephun.png'),
};

// Get 2 random different monsters for showcase
const getRandomShowcaseMonsters = () => {
  const monsterNames = Object.keys(PREMIUM_MONSTERS);
  const shuffled = [...monsterNames].sort(() => Math.random() - 0.5);
  return [
    PREMIUM_MONSTERS[shuffled[0] as keyof typeof PREMIUM_MONSTERS],
    PREMIUM_MONSTERS[shuffled[1] as keyof typeof PREMIUM_MONSTERS]
  ];
};

export default function AuthScreen() {
  const { user, loading, signInAnonymously, signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  
  // Random showcase monsters (2 different ones)
  const [showcaseMonsters] = useState(() => getRandomShowcaseMonsters());
  
  
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);
  
  const handleAnonymousLogin = async () => {
    await signInAnonymously();
  };

  const getSignInErrorMessage = (error: any) => {
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return t('auth.errors.userNotFound');
        case 'auth/wrong-password':
          return t('auth.errors.wrongPassword');
        case 'auth/invalid-email':
          return t('auth.errors.invalidEmail');
        case 'auth/user-disabled':
          return t('auth.errors.userDisabled');
        case 'auth/too-many-requests':
          return t('auth.errors.tooManyRequests');
        default:
          return error.message || t('auth.errors.generic');
      }
    }
    return error.message || t('auth.errors.generic');
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      showErrorAlert(t('common.error'), t('auth.enterEmailPassword'));
      return;
    }

    try {
      setLoginLoading(true);
      await signInWithEmail(email, password);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error signing in:', error);
      }
      showErrorAlert(t('common.error'), getSignInErrorMessage(error));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error signing in with Google:', error);
      }
      showErrorAlert(t('common.error'), t('auth.googleFailed'));
    }
  };

  const hideAnimation = () => {
    setShowAnimation(false);
  };
  
  if (loading) {
    return <LoadingOverlay message={t('auth.preparing')} />;
  }
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background.primary, Colors.primary[900], Colors.background.primary]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Creature</Text>
          <Text style={styles.logoAccent}>Nexus</Text>
        </View>
        
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        
        <View style={styles.cardsPreviewContainer}>
          <Image
            source={showcaseMonsters[0]}
            style={[styles.cardPreview, { transform: [{ rotate: '-10deg' }, { translateX: -20 }] }]}
          />
          <Image
            source={showcaseMonsters[1]}
            style={[styles.cardPreview, { transform: [{ rotate: '5deg' }, { translateX: 20 }] }]}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleAnonymousLogin}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.accent[700], Colors.accent[500]]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>{t('auth.start')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {!isDemoMode && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => setShowLoginModal(true)}
            activeOpacity={0.8}
          >
            <Mail size={20} color={Colors.accent[500]} />
            <Text style={styles.loginButtonText}>{t('auth.signInWithEmail')}</Text>
          </TouchableOpacity>
        )}

        {!isDemoMode && (
          <TouchableOpacity
            style={[styles.loginButton, styles.googleButton]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.termsText}>
          {t('auth.terms.prefix')}
          <Text 
            style={styles.privacyLink}
            onPress={() => router.push('/privacy-policy' as any)}
          >
            {t('auth.terms.privacy')}
          </Text>
          {t('auth.terms.suffix')}
        </Text>
      </View>

      {!isDemoMode && (
        <Modal
          visible={showLoginModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLoginModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('auth.modal.title')}</Text>
              <Text style={styles.modalSubtitle}>{t('auth.modal.subtitle')}</Text>

              <TextInput
                style={styles.input}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={Colors.text.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={Colors.text.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowLoginModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.signInButton]}
                  onPress={handleEmailLogin}
                  disabled={loginLoading}
                >
                  <Text style={styles.signInButtonText}>
                    {loginLoading ? t('auth.signingIn') : t('auth.signIn')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Full Screen Monster Animation Overlay */}
      {showAnimation && (
        <MonsterShowcaseAnimation
          transitionDuration={1200}
          fadeDuration={600}
          autoStart={true}
          fullScreen={true}
          onAnimationComplete={hideAnimation}
          onSkip={hideAnimation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 42,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
  },
  logoAccent: {
    fontSize: 42,
    fontFamily: 'Poppins-Bold',
    color: Colors.accent[500],
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginBottom: 40,
  },
  cardsPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 60,
  },
  cardPreview: {
    width: 150,
    height: 200,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.accent[500],
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  privacyLink: {
    color: Colors.accent[500],
    textDecorationLine: 'underline',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accent[500],
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.accent[500],
    marginLeft: 8,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderColor: '#dadce0',
    marginBottom: 16,
  },
  googleIcon: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#4285f4',
    backgroundColor: 'transparent',
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#3c4043',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background.secondary,
    marginRight: 8,
  },
  signInButton: {
    backgroundColor: Colors.accent[500],
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
  signInButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
});
