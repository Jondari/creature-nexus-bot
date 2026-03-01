import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Linking } from 'react-native';
import { DiscordIcon } from '@/components/DiscordIcon';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useStoryMode } from '@/context/StoryModeContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, Github, Globe, Mail, Save, Trash2, TestTube, Gift, Shield } from 'lucide-react-native';
import { showSuccessAlert, showErrorAlert } from '@/utils/alerts';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { isDemoMode } from '@/config/localMode';

// Lazy-load RedeemCodeModal to avoid pulling Firebase in demo mode
const RedeemCodeModal = isDemoMode
  ? null
  : require('@/components/RedeemCodeModal').RedeemCodeModal;
import { AvatarSelector } from '@/components/AvatarSelector';
import { MusicControls } from '@/components/MusicControls';
import { getPseudoValidationError, PSEUDO_MIN_LENGTH, PSEUDO_MAX_LENGTH } from '@/utils/pseudoUtils';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';

const packageJson = require('../../package.json');
const DISCORD_INVITE_URL = process.env.EXPO_PUBLIC_DISCORD_INVITE_URL;

export default function ProfileScreen() {
  const { user, signOut, linkWithEmail, linkWithGoogle, deleteAccount, isAnonymous, avatarCreature, updateAvatar, pseudo, pseudoChangeUsed, updatePseudo, addCoins } = useAuth();
  const { cardSize, setCardSize, showBattleLog, setShowBattleLog, screenShake, setScreenShake, turnBanner, setTurnBanner, locale, setLocale } = useSettings();
  const { resetProgress, unlockAllChapters } = useStoryMode();
  const router = useRouter();

  // Debug auth state
  if (__DEV__) {
    console.log('Profile Screen - User:', user);
    console.log('Profile Screen - Is Anonymous:', isAnonymous);
  }
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showPseudoModal, setShowPseudoModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPseudo, setNewPseudo] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pseudoLoading, setPseudoLoading] = useState(false);
  

  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (error) {
      if (__DEV__) {
        console.error('Error signing out:', error);
      }
      showErrorAlert(t('common.error'), t('profile.signOutFailed'));
    }
  };

  const getErrorMessage = (error: any) => {
    if (error.code) {
      switch (error.code) {
        case 'auth/weak-password':
          return t('profile.linkEmail.errors.weakPassword');
        case 'auth/email-already-in-use':
          return t('profile.linkEmail.errors.emailInUse');
        case 'auth/invalid-email':
          return t('profile.linkEmail.errors.invalidEmail');
        case 'auth/credential-already-in-use':
          return t('profile.linkEmail.errors.credentialInUse');
        default:
          return error.message || t('profile.linkEmail.errors.generic');
      }
    }
    return error.message || t('profile.linkEmail.errors.generic');
  };

  const handleLinkWithEmail = async () => {
    if (!email || !password) {
      showErrorAlert(t('common.error'), t('profile.enterEmailPassword'));
      return;
    }

    if (password.length < 6) {
      showErrorAlert(t('common.error'), t('profile.passwordTooShort'));
      return;
    }

    try {
      setLoading(true);
      await linkWithEmail(email, password);
      setShowLinkModal(false);
      setEmail('');
      setPassword('');
      showSuccessAlert(t('common.success'), t('profile.linkEmail.success'));
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error linking account:', error);
      }
      showErrorAlert(t('common.error'), getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWithGoogle = async () => {
    try {
      setLoading(true);
      await linkWithGoogle();
      showSuccessAlert(t('common.success'), t('profile.linkGoogle.success'));
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error linking with Google:', error);
      }
      showErrorAlert(t('common.error'), t('profile.linkGoogle.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await deleteAccount();
      setShowDeleteModal(false);
      router.replace('/(auth)');
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error deleting account:', error);
      }
      showErrorAlert(t('common.error'), t('profile.deleteAccountFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAvatarSelect = async (creatureName: string | null) => {
    try {
      await updateAvatar(creatureName);
      showSuccessAlert(
        t('common.success'),
        t('avatar.avatarUpdated')
      );
    } catch (error) {
      if (__DEV__) {
        console.error('Error updating avatar:', error);
      }
      showErrorAlert(
        t('common.error'),
        t('avatar.avatarUpdateFailed')
      );
    }
  };

  const handleOpenPseudoModal = () => {
    setNewPseudo(pseudo || '');
    setShowPseudoModal(true);
  };

  const handlePseudoChange = async () => {
    const validationError = getPseudoValidationError(newPseudo);
    if (validationError) {
      showErrorAlert(t('common.error'), t(validationError));
      return;
    }

    try {
      setPseudoLoading(true);
      await updatePseudo(newPseudo);
      setShowPseudoModal(false);
      showSuccessAlert(
        t('common.success'),
        t('pseudo.pseudoUpdated')
      );
    } catch (error) {
      if (__DEV__) {
        console.error('Error updating pseudo:', error);
      }
      showErrorAlert(
        t('common.error'),
        t('pseudo.pseudoUpdateFailed')
      );
    } finally {
      setPseudoLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary[900], Colors.background.primary]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <PlayerAvatar
            creatureName={avatarCreature}
            size="large"
          />
          <Text style={styles.pseudoDisplay}>{pseudo || t('pseudo.defaultPseudo')}</Text>
          <View style={styles.avatarButtons}>
            <TouchableOpacity
              style={styles.changeAvatarButton}
              onPress={() => setShowAvatarSelector(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.changeAvatarText}>{t('avatar.changeAvatar')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.changeAvatarButton,
                styles.changePseudoButton,
                pseudoChangeUsed && styles.changePseudoButtonDisabled
              ]}
              onPress={handleOpenPseudoModal}
              activeOpacity={0.8}
              disabled={pseudoChangeUsed}
            >
              <Text style={[
                styles.changeAvatarText,
                pseudoChangeUsed && styles.changePseudoTextDisabled
              ]}>
                {pseudoChangeUsed ? t('pseudo.changeUsed') : t('pseudo.changePseudo')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.accountTitle')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.userId')}</Text>
            <Text style={styles.infoValue}>{user?.uid.substring(0, 8)}...</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.accountType')}</Text>
            <Text style={styles.infoValue}>{isAnonymous ? t('profile.accountTypeAnonymous') : t('profile.accountTypeRegistered')}</Text>
          </View>
          {!isAnonymous && user?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.email')}</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.created')}</Text>
              <Text style={styles.infoValue}>{user?.metadata.creationTime 
              ? new Date(user.metadata.creationTime).toLocaleDateString() 
              : t('common.unknown')}</Text>
          </View>
        </View>
        
        {isAnonymous && !isDemoMode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('profile.saveProgressTitle')}</Text>
            <Text style={styles.cardText}>{t('profile.saveProgressText')}</Text>
            <TouchableOpacity
              style={styles.saveProgressButton}
              onPress={() => setShowLinkModal(true)}
              activeOpacity={0.8}
            >
              <Save size={20} color={Colors.text.primary} />
              <Text style={styles.saveProgressText}>{t('profile.createAccountEmail')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveProgressButton, styles.googleSaveButton]}
              onPress={handleLinkWithGoogle}
              activeOpacity={0.8}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleSaveText}>{t('profile.saveWithGoogle')}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.language')}</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('profile.appLanguage')}</Text>
              <Text style={styles.settingDescription}>{t('profile.appLanguageDesc')}</Text>
            </View>
            <View style={styles.settingButtons}>
              <TouchableOpacity
                style={[styles.settingButton, locale === 'en' && styles.settingButtonActive]}
                onPress={() => setLocale('en')}
              >
                <Text style={[styles.settingButtonText, locale === 'en' && styles.settingButtonTextActive]}>{t('common.lang.english')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.settingButton, locale === 'fr' && styles.settingButtonActive]}
                onPress={() => setLocale('fr')}
              >
                <Text style={[styles.settingButtonText, locale === 'fr' && styles.settingButtonTextActive]}>{t('common.lang.french')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.gameSettings')}</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('profile.cardSize')}</Text>
              <Text style={styles.settingDescription}>{t('profile.cardSizeDesc')}</Text>
            </View>
            <View style={styles.settingButtons}>
              <TouchableOpacity
                style={[
                  styles.settingButton,
                  cardSize === 'small' && styles.settingButtonActive
                ]}
                onPress={() => setCardSize('small')}
              >
                <Text style={[
                  styles.settingButtonText,
                  cardSize === 'small' && styles.settingButtonTextActive
                ]}>
                  {t('profile.cardSizeSmall')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.settingButton,
                  cardSize === 'normal' && styles.settingButtonActive
                ]}
                onPress={() => setCardSize('normal')}
              >
                <Text style={[
                  styles.settingButtonText,
                  cardSize === 'normal' && styles.settingButtonTextActive
                ]}>
                  {t('profile.cardSizeNormal')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('profile.battleLog')}</Text>
              <Text style={styles.settingDescription}>{t('profile.battleLogDesc')}</Text>
            </View>
            <View style={styles.settingButtons}>
              <TouchableOpacity
                style={[
                  styles.settingButton,
                  !showBattleLog && styles.settingButtonActive
                ]}
                onPress={() => setShowBattleLog(false)}
              >
                <Text style={[
                  styles.settingButtonText,
                  !showBattleLog && styles.settingButtonTextActive
                ]}>
                  {t('profile.battleLogHidden')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.settingButton,
                  showBattleLog && styles.settingButtonActive
                ]}
                onPress={() => setShowBattleLog(true)}
              >
                <Text style={[
                  styles.settingButtonText,
                  showBattleLog && styles.settingButtonTextActive
                ]}>
                  {t('profile.battleLogVisible')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('profile.screenShake')}</Text>
              <Text style={styles.settingDescription}>{t('profile.screenShakeDesc')}</Text>
            </View>
            <View style={styles.settingButtons}>
              <TouchableOpacity
                style={[
                  styles.settingButton,
                  !screenShake && styles.settingButtonActive
                ]}
                onPress={() => setScreenShake(false)}
              >
                <Text style={[
                  styles.settingButtonText,
                  !screenShake && styles.settingButtonTextActive
                ]}>
                  {t('profile.screenShakeOff')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.settingButton,
                  screenShake && styles.settingButtonActive
                ]}
                onPress={() => setScreenShake(true)}
              >
                <Text style={[
                  styles.settingButtonText,
                  screenShake && styles.settingButtonTextActive
                ]}>
                  {t('profile.screenShakeOn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Turn Banner */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('profile.turnBanner')}</Text>
              <Text style={styles.settingDescription}>{t('profile.turnBannerDesc')}</Text>
            </View>
            <View style={styles.settingButtons}>
              <TouchableOpacity
                style={[
                  styles.settingButton,
                  !turnBanner && styles.settingButtonActive
                ]}
                onPress={() => setTurnBanner(false)}
              >
                <Text style={[
                  styles.settingButtonText,
                  !turnBanner && styles.settingButtonTextActive
                ]}>
                  {t('profile.turnBannerOff')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.settingButton,
                  turnBanner && styles.settingButtonActive
                ]}
                onPress={() => setTurnBanner(true)}
              >
                <Text style={[
                  styles.settingButtonText,
                  turnBanner && styles.settingButtonTextActive
                ]}>
                  {t('profile.turnBannerOn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Music Controls */}
        <View style={styles.card}>
          <MusicControls />
        </View>

        {!isDemoMode && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.redeemTitle')}</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('profile.redeemEnterCode')}</Text>
              <Text style={styles.settingDescription}>{t('profile.redeemDesc')}</Text>
            </View>
            <View style={styles.settingButtons}>
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={() => setShowRedeemModal(true)}
                activeOpacity={0.8}
              >
                <Gift size={16} color={Colors.text.primary} />
                <Text style={styles.redeemButtonText}>{t('profile.redeemButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        )}

        {/* A supprimer */}
        {__DEV__ && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.devToolsTitle')}</Text>
          <Text style={styles.cardText}>{t('profile.devToolsText')}</Text>
          
          <View style={styles.links}>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/card-test' as any)}
            >
              <TestTube size={20} color={Colors.text.primary} />
              <Text style={styles.linkText}>{t('profile.cardIllustrationsTest')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/dev-storymap' as any)}
            >
              <TestTube size={20} color={'#9333ea'} />
              <Text style={[styles.linkText, { color: '#9333ea' }]}>{t('profile.storyMapVisualizer')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/battlefield-theme-test' as any)}
            >
              <TestTube size={20} color={Colors.accent[500]} />
              <Text style={[styles.linkText, { color: Colors.accent[500] }]}>{t('profile.battlefieldThemeLab')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={async () => {
                if (user) {
                  try {
                    await addCoins(10000);
                    showSuccessAlert(
                      t('profile.devToolsTitle'),
                      t('profile.dev.addCoinsSuccess', { amount: '10,000' })
                    );
                  } catch (error) {
                    showErrorAlert(
                      t('profile.devToolsTitle'),
                      t('profile.dev.addCoinsFailed')
                    );
                  }
                }
              }}
            >
              <TestTube size={20} color={'#ffd700'} />
              <Text style={[styles.linkText, { color: '#ffd700' }]}>{t('profile.addCoinsDev')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={async () => {
                try {
                  await resetProgress();
                  showSuccessAlert(
                    t('profile.devToolsTitle'),
                    t('profile.dev.resetStorySuccess')
                  );
                } catch (error) {
                  showErrorAlert(
                    t('profile.devToolsTitle'),
                    t('profile.dev.resetStoryFailed')
                  );
                }
              }}
            >
              <TestTube size={20} color={'#ff6b6b'} />
              <Text style={[styles.linkText, { color: '#ff6b6b' }]}>{t('profile.resetStory')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={async () => {
                try {
                  await unlockAllChapters();
                  showSuccessAlert(
                    t('profile.devToolsTitle'),
                    t('profile.dev.unlockAllSuccess')
                  );
                } catch (error) {
                  showErrorAlert(
                    t('profile.devToolsTitle'),
                    t('profile.dev.unlockAllFailed')
                  );
                }
              }}
            >
              <TestTube size={20} color={'#4ecdc4'} />
              <Text style={[styles.linkText, { color: '#4ecdc4' }]}>{t('profile.unlockAllChapters')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/animation-demo' as any)}
            >
              <TestTube size={20} color={'#00ff9f'} />
              <Text style={[styles.linkText, { color: '#00ff9f' }]}>{t('profile.animationDemo')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.aboutTitle')}</Text>
          <Text style={styles.cardText}>{t('profile.aboutText')}</Text>
          
          <View style={styles.links}>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => {
                // Open GitHub repository
                const url = 'https://github.com/Jondari/creature-nexus-tcg';
                Linking.openURL(url);
              }}
            >
              <Github size={20} color={Colors.text.primary} />
              <Text style={styles.linkText}>{t('profile.github')}</Text>
            </TouchableOpacity>

            {DISCORD_INVITE_URL ? (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => Linking.openURL(DISCORD_INVITE_URL)}
              >
                <DiscordIcon size={20} color={Colors.text.primary} />
                <Text style={styles.linkText}>{t('profile.discord')}</Text>
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => {
                // Open official website
                const url = 'https://creature-nexus.netlify.app';
                Linking.openURL(url);
              }}
            >
              <Globe size={20} color={Colors.text.primary} />
              <Text style={styles.linkText}>{t('profile.website')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/privacy-policy' as any)}
            >
              <Shield size={20} color={Colors.text.primary} />
              <Text style={styles.linkText}>{t('profile.privacy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={Colors.text.primary} />
          <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>

        {!isAnonymous && (
          <TouchableOpacity 
            style={styles.deleteAccountButton} 
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Trash2 size={20} color={Colors.error || '#ff4444'} />
            <Text style={styles.deleteAccountText}>{t('profile.deleteAccount')}</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.versionText}>{t('profile.version', { version: packageJson.version })}</Text>
      </ScrollView>

      <Modal
        visible={showLinkModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.createAccountModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.createAccountModalSubtitle')}</Text>
            
            <TextInput
              style={styles.input}
              placeholder={t('profile.emailPlaceholder')}
              placeholderTextColor={Colors.text.secondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder={t('profile.passwordPlaceholder')}
              placeholderTextColor={Colors.text.secondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLinkModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleLinkWithEmail}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? t('profile.saving') : t('profile.saveAccount')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.deleteAccountModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.deleteAccountModalSubtitle')}</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteAccount}
                disabled={deleteLoading}
              >
                <Text style={styles.deleteButtonText}>
                  {deleteLoading ? t('common.loading') : t('profile.confirmDelete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {!isDemoMode && RedeemCodeModal && (
        <RedeemCodeModal
          visible={showRedeemModal}
          onClose={() => setShowRedeemModal(false)}
          onSuccess={() => {
            // Optionally refresh currency or show additional success feedback
          }}
        />
      )}

      <AvatarSelector
        visible={showAvatarSelector}
        currentAvatar={avatarCreature}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
      />

      <Modal
        visible={showPseudoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPseudoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('pseudo.changePseudoTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('pseudo.changePseudoWarning')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('pseudo.pseudoPlaceholder')}
              placeholderTextColor={Colors.text.secondary}
              value={newPseudo}
              onChangeText={setNewPseudo}
              autoCapitalize="none"
              maxLength={PSEUDO_MAX_LENGTH}
            />
            <Text style={styles.pseudoHint}>
              {t('pseudo.pseudoHint', { min: String(PSEUDO_MIN_LENGTH), max: String(PSEUDO_MAX_LENGTH) })}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPseudoModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handlePseudoChange}
                disabled={pseudoLoading}
              >
                <Text style={styles.saveButtonText}>
                  {pseudoLoading ? t('common.loading') : t('common.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    marginTop: 60,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  cardText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  settingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  settingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    minWidth: 70,
    alignItems: 'center',
  },
  settingButtonActive: {
    backgroundColor: Colors.accent[600],
  },
  settingButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
  settingButtonTextActive: {
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  links: {
    marginTop: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
    marginLeft: 12,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent?.[500] || Colors.primary || '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  redeemButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error || '#ff4444',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
  },
  deleteAccountText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.error || '#ff4444',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 40,
  },
  saveProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent[500],
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  saveProgressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  googleSaveButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
    marginTop: 8,
  },
  googleIcon: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#4285f4',
    backgroundColor: 'transparent',
  },
  googleSaveText: {
    fontSize: 14,
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
  saveButton: {
    backgroundColor: Colors.accent[500],
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  deleteButton: {
    backgroundColor: Colors.error || '#ff4444',
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
  },
  changeAvatarButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.accent[500],
    borderRadius: 20,
  },
  changeAvatarText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  pseudoDisplay: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
    marginTop: 12,
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  changePseudoButton: {
    backgroundColor: Colors.primary[600],
  },
  changePseudoButtonDisabled: {
    backgroundColor: Colors.background.secondary,
  },
  changePseudoTextDisabled: {
    color: Colors.text.secondary,
  },
  pseudoHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginTop: -4,
    marginBottom: 12,
  },
});
