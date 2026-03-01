import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { RedeemCodeService } from '@/services/redeemCodeService';
import { showSuccessAlert, showErrorAlert } from '@/utils/alerts';
import { RewardAnimation } from '@/components/Animation/RewardAnimation';
import { BoosterPack } from '@/models/BoosterPack';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';

interface RedeemCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RedeemCodeModal: React.FC<RedeemCodeModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [pendingAnims, setPendingAnims] = useState<Array<{ type: 'coins' | 'pack' | 'card'; payload: any }>>([]);
  const [currentAnim, setCurrentAnim] = useState<{ type: 'coins' | 'pack' | 'card'; payload: any } | null>(null);
  const { user } = useAuth();

  const handleRedeem = async () => {
    if (!user || !code.trim()) return;

    setIsRedeeming(true);
    
    try {
      const result = await RedeemCodeService.redeemCode(code, user.uid);
      
      if (result.success) {
        // Queue reward animations: coins, packs, cards
        const queue: Array<{ type: 'coins' | 'pack' | 'card'; payload: any }> = [];
        if (result.details?.coins) {
          queue.push({ type: 'coins', payload: { amount: result.details.coins } });
        }
        if (result.details?.packs?.length) {
          for (const pack of result.details.packs as BoosterPack[]) {
            queue.push({ type: 'pack', payload: { pack } });
          }
        }
        if (result.details?.cards?.length) {
          for (const card of result.details.cards) {
            queue.push({ type: 'card', payload: { card } });
          }
        }

        if (queue.length === 0) {
          showSuccessAlert(
            t('redeem.codeRedeemedTitle'),
            result.message || t('redeem.rewardsAdded')
          );
          setCode('');
          onClose();
          onSuccess?.();
        } else {
          setPendingAnims(queue);
          setCurrentAnim(queue[0]);
        }
      } else {
        showErrorAlert(
          t('redeem.redemptionFailedTitle'),
          result.error || t('redeem.invalidCode')
        );
      }
    } catch (error) {
      showErrorAlert(
        t('redeem.redemptionFailedTitle'),
        t('redeem.failedGeneric')
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleClose = () => {
    if (!isRedeeming) {
      setCode('');
      onClose();
    }
  };

  const handleAnimComplete = () => {
    if (pendingAnims.length <= 1) {
      // Finished all animations
      setPendingAnims([]);
      setCurrentAnim(null);
      setCode('');
      onClose();
      onSuccess?.();
      return;
    }
    const next = pendingAnims.slice(1);
    setPendingAnims(next);
    setCurrentAnim(next[0]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t('profile.redeemTitle')}</Text>
          <Text style={styles.subtitle}>{t('profile.redeemDesc')}</Text>
          
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder={t('profile.redeemEnterCode')}
            placeholderTextColor={Colors.text?.secondary || '#666'}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            editable={!isRedeeming}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              disabled={isRedeeming}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.redeemButton, 
                (!code.trim() || isRedeeming) && styles.disabledButton
              ]}
              onPress={handleRedeem}
              disabled={!code.trim() || isRedeeming}
            >
              {isRedeeming ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.redeemButtonText}>{t('profile.redeemButton')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Reward overlay animations */}
        {currentAnim && (
          <RewardAnimation
            type={currentAnim.type}
            message={
              currentAnim.type === 'coins'
                ? t('redeem.reward.coins', { amount: String(currentAnim.payload.amount) })
                : currentAnim.type === 'pack'
                ? t('redeem.reward.pack', { name: String(currentAnim.payload.pack.name) })
                : t('redeem.reward.card', { name: String(currentAnim.payload.card.name) })
            }
            coins={currentAnim.type === 'coins' ? currentAnim.payload.amount : undefined}
            pack={currentAnim.type === 'pack' ? currentAnim.payload.pack : undefined}
            card={currentAnim.type === 'card' ? currentAnim.payload.card : undefined}
            onComplete={handleAnimComplete}
            durationMs={1600}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.background?.card || '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text?.primary || '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text?.secondary || '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border || '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text?.primary || '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: Colors.background?.input || 'rgba(255, 255, 255, 0.05)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.background?.secondary || '#333',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text?.secondary || '#999',
  },
  redeemButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.accent?.[500] || '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    minHeight: 44,
  },
  redeemButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text?.primary || '#ffffff',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
