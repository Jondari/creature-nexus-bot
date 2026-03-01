import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ActionLogEntry } from '../types/game';
import { t } from '../utils/i18n';

interface ActionLogProps {
  logs: ActionLogEntry[];
  sidebarMode?: boolean; // When true, skip the collapsible header
}

export function ActionLog({ logs, sidebarMode = false }: ActionLogProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const resolveDescription = (raw?: string): string | undefined => {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const translated = t(trimmed);
    return translated !== trimmed ? translated : trimmed;
  };

  const formatActionDescription = (entry: ActionLogEntry): string => {
    const { action } = entry;
    const localDescription = resolveDescription(entry.description);
    
    switch (action.type) {
      case 'PLAY_CARD':
        return localDescription || t('battle.log.playCard');
      case 'CAST_SPELL':
        return localDescription || t('battle.log.castSpell');
      case 'ATTACK':
        return localDescription || t(action.targetCardId ? 'battle.log.attackCreature' : 'battle.log.attackDirect');
      case 'RETIRE_CARD':
        return localDescription || t('battle.log.retireCard');
      case 'END_TURN':
        return localDescription || t('actions.endTurn');
      default:
        return localDescription || t('battle.log.unknown');
    }
  };

  const getActionIcon = (actionType: string, success: boolean): string => {
    if (!success) return '❌';
    
    switch (actionType) {
      case 'PLAY_CARD': return '🃏';
      case 'CAST_SPELL': return '✨';
      case 'ATTACK': return '⚔️';
      case 'RETIRE_CARD': return '🔄';
      case 'END_TURN': return '⏭️';
      default: return '❓';
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // In sidebar mode, always show content (no collapse)
  const showContent = sidebarMode || !isCollapsed;

  return (
    <View style={[
      styles.container, 
      isCollapsed && !sidebarMode && styles.collapsed,
      sidebarMode && styles.sidebarContainer
    ]}>
      {!sidebarMode && (
        <TouchableOpacity 
          style={styles.header}
          onPress={() => setIsCollapsed(!isCollapsed)}
        >
      <Text style={styles.title}>{t('battle.actionLog')}</Text>
          <Text style={styles.toggleIcon}>{isCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
      )}
      
      {showContent && (
        <ScrollView 
          style={[styles.logContainer, sidebarMode && styles.sidebarLogContainer]} 
          showsVerticalScrollIndicator={true}
        >
          {logs.length === 0 ? (
            <Text style={[styles.emptyText, sidebarMode && styles.sidebarEmptyText]}>
              {t('battle.log.noActions')}
            </Text>
          ) : (
            logs.map((entry) => (
              <View key={entry.id} style={[
                styles.logEntry, 
                !entry.success && styles.failedEntry,
                sidebarMode && styles.sidebarLogEntry
              ]}>
                <View style={styles.logHeader}>
                  <Text style={[styles.playerName, sidebarMode && styles.sidebarPlayerName]}>
                    {getActionIcon(entry.action.type, entry.success)} {entry.playerName}
                  </Text>
                  <Text style={[styles.timestamp, sidebarMode && styles.sidebarTimestamp]}>
                    {formatTime(entry.timestamp)}
                  </Text>
                </View>
                <Text style={[styles.actionDescription, sidebarMode && styles.sidebarActionDescription]}>
                  {formatActionDescription(entry)}
                </Text>
                <Text style={[styles.turnInfo, sidebarMode && styles.sidebarTurnInfo]}>
                  {t('battle.log.turn', { turn: String(entry.turn) })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: '#FFF',
    borderRadius: 8,
    boxShadow: '0px 2px 3.84px 0px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    maxHeight: '80%',
  },
  collapsed: {
    maxHeight: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#4CAF50',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logContainer: {
    maxHeight: 400,
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  logEntry: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    marginVertical: 2,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  failedEntry: {
    borderLeftColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
  },
  actionDescription: {
    fontSize: 11,
    color: '#444',
    marginBottom: 2,
  },
  turnInfo: {
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
  },
  // Sidebar-specific styles
  sidebarContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    elevation: 0,
    maxHeight: '100%',
    borderRadius: 0,
  },
  sidebarLogContainer: {
    flex: 1,
    maxHeight: '95%',
    padding: 16,
    minHeight: 500,
  },
  sidebarLogEntry: {
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    marginVertical: 4,
    padding: 12,
  },
  sidebarEmptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 40,
    fontSize: 16,
  },
  sidebarPlayerName: {
    fontSize: 13,
    fontWeight: '600',
  },
  sidebarTimestamp: {
    fontSize: 11,
  },
  sidebarActionDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  sidebarTurnInfo: {
    fontSize: 11,
  },
});
