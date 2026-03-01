import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { PlayerAvatar } from '@/components/PlayerAvatar';

interface StatDescriptor {
  label: string;
  value: React.ReactNode;
}

interface PlayerInfoProps {
  name: string;
  stats: StatDescriptor[];
  subtitle?: React.ReactNode;
  containerRef?: React.Ref<View>;
  avatarCreature?: string | null;
  avatarPosition?: 'left' | 'right';
}

export function PlayerInfo({
  name,
  stats,
  subtitle,
  containerRef,
  avatarCreature,
  avatarPosition = 'left',
}: PlayerInfoProps) {
  const showAvatar = avatarCreature !== undefined;
  const isAvatarLeft = avatarPosition === 'left';

  const renderAvatar = () => {
    if (!showAvatar) return null;
    return (
      <View style={styles.avatarContainer}>
        <PlayerAvatar creatureName={avatarCreature} size="small" />
      </View>
    );
  };

  const renderContent = () => (
    <View style={[styles.contentContainer, showAvatar && styles.contentWithAvatar]}>
      <Text style={[styles.playerName, showAvatar && styles.playerNameWithAvatar]}>
        {name}
      </Text>

      {subtitle ? (
        <View style={styles.subtitleContainer}>
          {typeof subtitle === 'string' ? (
            <Text style={styles.subtitleText}>{subtitle}</Text>
          ) : (
            subtitle
          )}
        </View>
      ) : null}

      <View style={[styles.statsRow, showAvatar && styles.statsRowWithAvatar]}>
        {stats.map(({ label, value }, index) => (
          <Text key={`${label}-${index}`} style={styles.statText}>
            {label}: {value}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <View ref={containerRef} style={[styles.container, showAvatar && styles.containerWithAvatar]}>
      {isAvatarLeft && renderAvatar()}
      {renderContent()}
      {!isAvatarLeft && renderAvatar()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    padding: 12,
    margin: 8,
    borderRadius: 8,
    boxShadow: '0px 1px 2.22px 0px rgba(0, 0, 0, 0.22)',
    elevation: 3,
  },
  containerWithAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  contentContainer: {
    flex: 1,
  },
  contentWithAvatar: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.text.primary,
  },
  playerNameWithAvatar: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsRowWithAvatar: {
    justifyContent: 'space-around',
  },
  statText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
