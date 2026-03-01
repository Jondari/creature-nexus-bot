import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView
} from 'react-native';
import { PlayerAvatar } from './PlayerAvatar';
import { AVAILABLE_AVATARS } from '@/utils/avatarUtils';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';

interface AvatarSelectorProps {
  visible: boolean;
  currentAvatar: string | null;
  onClose: () => void;
  onSelect: (creatureName: string | null) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  visible,
  currentAvatar,
  onClose,
  onSelect
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar);

  const handleConfirm = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  const handleCancel = () => {
    setSelectedAvatar(currentAvatar); // Reset to initial value
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t('avatar.selectAvatar')}</Text>
          <Text style={styles.subtitle}>{t('avatar.selectAvatarDesc')}</Text>

          {/* Avatar grid */}
          <ScrollView
            contentContainerStyle={styles.avatarGrid}
            showsVerticalScrollIndicator={false}
          >
            {/* Default avatar */}
            <TouchableOpacity
              style={[
                styles.avatarOption,
                selectedAvatar === null && styles.avatarOptionSelected
              ]}
              onPress={() => setSelectedAvatar(null)}
              activeOpacity={0.7}
            >
              <PlayerAvatar
                creatureName={null}
                size="medium"
                showBorder={selectedAvatar === null}
              />
              <Text style={styles.avatarName}>{t('avatar.defaultAvatar')}</Text>
            </TouchableOpacity>

            {/* Creature avatars */}
            {AVAILABLE_AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar.name}
                style={[
                  styles.avatarOption,
                  selectedAvatar === avatar.name && styles.avatarOptionSelected
                ]}
                onPress={() => setSelectedAvatar(avatar.name)}
                activeOpacity={0.7}
              >
                <PlayerAvatar
                  creatureName={avatar.name}
                  size="medium"
                  showBorder={selectedAvatar === avatar.name}
                />
                <Text style={styles.avatarName}>{avatar.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  avatarOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    width: 130,
  },
  avatarOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarName: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.text?.primary || '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.background?.secondary || '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text?.secondary || '#999',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.accent?.[500] || '#007AFF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text?.primary || '#ffffff',
  },
});
