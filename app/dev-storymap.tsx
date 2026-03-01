import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Plus, Eye, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import StoryMap from '@/components/StoryMap';
import { StoryChapter, StoryBattle } from '@/data/storyMode';
import { t } from '@/utils/i18n';

interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isBoss: boolean;
  connections: string[];
}

export default function DevStoryMapScreen() {
  const router = useRouter();
  const [nodes, setNodes] = useState<MapNode[]>(() => [
    {
      id: 'battle1',
      name: t('devStoryMap.sample.firstBattle'),
      x: 50,
      y: 90,
      isBoss: false,
      connections: ['battle2']
    },
    {
      id: 'battle2',
      name: t('devStoryMap.sample.secondBattle'),
      x: 30,
      y: 60,
      isBoss: false,
      connections: ['battle3']
    },
    {
      id: 'battle3',
      name: t('devStoryMap.sample.bossBattle'),
      x: 70,
      y: 30,
      isBoss: true,
      connections: []
    }
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const [nodeCount, setNodeCount] = useState('3');

  const addNode = () => {
    const newId = `battle${nodes.length + 1}`;
    const newNode: MapNode = {
      id: newId,
      name: t('devStoryMap.autoBattleName', { index: String(nodes.length + 1) }),
      x: 50,
      y: 50,
      isBoss: false,
      connections: []
    };
    setNodes([...nodes, newNode]);
  };

  const removeNode = (id: string) => {
    const updatedNodes = nodes.filter(node => node.id !== id);
    // Remove references to this node from other nodes' connections
    const cleanedNodes = updatedNodes.map(node => ({
      ...node,
      connections: node.connections.filter(conn => conn !== id)
    }));
    setNodes(cleanedNodes);
  };

  const updateNode = (id: string, field: keyof MapNode, value: any) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, [field]: value } : node
    ));
  };

  const generateNodes = () => {
    const count = Math.max(1, parseInt(nodeCount) || 3);
    const newNodes: MapNode[] = [];

    for (let i = 1; i <= count; i++) {
      const isLast = i === count;
      const nextId = isLast ? [] : [`battle${i + 1}`];

      newNodes.push({
        id: `battle${i}`,
        name: isLast
          ? t('devStoryMap.autoBossName')
          : t('devStoryMap.autoBattleName', { index: String(i) }),
        x: count > 1 ? 20 + (i - 1) * (60 / (count - 1)) : 50,
        y: count > 1 ? 90 - (i - 1) * (60 / (count - 1)) : 50,
        isBoss: isLast,
        connections: nextId
      });
    }

    setNodes(newNodes);
  };

  const createPreviewChapter = (): StoryChapter => {
    const battles: StoryBattle[] = nodes.map((node, index) => ({
      id: node.id,
      name: node.name,
      description: t('devStoryMap.sample.battleDescription', { name: node.name }),
      x: node.x,
      y: node.y,
      connections: node.connections,
      isCompleted: false,
      isAccessible: index === 0, // Only first battle accessible by default
      isBoss: node.isBoss
    }));

    return {
      id: 999,
      name: t('devStoryMap.sample.chapterName'),
      description: t('devStoryMap.sample.chapterDescription'),
      element: 'all',
      colorTheme: {
        primary: '#8B5CF6',
        secondary: '#A78BFA', 
        accent: '#C4B5FD',
        background: '#1E1B4B'
      },
      isUnlocked: true,
      isCompleted: false,
      battles
    };
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary[900], Colors.background.primary]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{t('profile.storyMapVisualizer')}</Text>
            <Text style={styles.subtitle}>{t('devStoryMap.subtitle')}</Text>
          </View>
        </View>

        {!showPreview ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('devStoryMap.generateNodes')}</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={t('devStoryMap.numberOfBattles')}
                  placeholderTextColor={Colors.text.secondary}
                  value={nodeCount}
                  onChangeText={setNodeCount}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.generateButton} onPress={generateNodes}>
                  <Text style={styles.generateButtonText}>{t('devStoryMap.generate')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('devStoryMap.battleNodes', { count: String(nodes.length) })}</Text>
                <TouchableOpacity style={styles.addButton} onPress={addNode}>
                  <Plus size={20} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              {nodes.map((node, index) => (
                <View key={node.id} style={styles.nodeCard}>
                  <View style={styles.nodeHeader}>
                    <Text style={styles.nodeTitle}>{t('devStoryMap.nodeLabel', { index: String(index + 1) })}</Text>
                    <TouchableOpacity onPress={() => removeNode(node.id)}>
                      <Trash2 size={16} color={Colors.error || '#ff4444'} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder={t('devStoryMap.battleIdPlaceholder')}
                    placeholderTextColor={Colors.text.secondary}
                    value={node.id}
                    onChangeText={(value) => updateNode(node.id, 'id', value)}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder={t('devStoryMap.battleNamePlaceholder')}
                    placeholderTextColor={Colors.text.secondary}
                    value={node.name}
                    onChangeText={(value) => updateNode(node.id, 'name', value)}
                  />

                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginRight: 8 }]}
                      placeholder={t('devStoryMap.xPositionPlaceholder')}
                      placeholderTextColor={Colors.text.secondary}
                      value={node.x.toString()}
                      onChangeText={(value) => updateNode(node.id, 'x', parseFloat(value) || 0)}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={t('devStoryMap.yPositionPlaceholder')}
                      placeholderTextColor={Colors.text.secondary}
                      value={node.y.toString()}
                      onChangeText={(value) => updateNode(node.id, 'y', parseFloat(value) || 0)}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.row}>
                    <TouchableOpacity
                      style={[
                        styles.bossButton,
                        node.isBoss && styles.bossButtonActive
                      ]}
                      onPress={() => updateNode(node.id, 'isBoss', !node.isBoss)}
                    >
                      <Text style={[
                        styles.bossButtonText,
                        node.isBoss && styles.bossButtonTextActive
                      ]}>
                        {node.isBoss ? t('devStoryMap.bossButtonBoss') : t('devStoryMap.bossButtonNormal')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.connectionLabel}>{t('devStoryMap.connectionsLabel')}</Text>
                  {node.connections.map((connection, connIndex) => (
                    <View key={connIndex} style={styles.connectionRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 4, marginRight: 8 }]}
                        placeholder={t('devStoryMap.battleIdPlaceholder')}
                        placeholderTextColor={Colors.text.secondary}
                        value={connection}
                        onChangeText={(value) => {
                          const newConnections = [...node.connections];
                          newConnections[connIndex] = value;
                          updateNode(node.id, 'connections', newConnections.filter(c => c.trim()));
                        }}
                        autoCorrect={false}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.removeConnectionButton}
                        onPress={() => {
                          const newConnections = node.connections.filter((_, i) => i !== connIndex);
                          updateNode(node.id, 'connections', newConnections);
                        }}
                      >
                        <Trash2 size={16} color={Colors.error || '#ff4444'} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    style={styles.addConnectionButton}
                    onPress={() => {
                      updateNode(node.id, 'connections', [...node.connections, '']);
                    }}
                  >
                    <Plus size={16} color={Colors.text.primary} />
                    <Text style={styles.addConnectionText}>{t('devStoryMap.addConnection')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.previewButton}
              onPress={() => setShowPreview(true)}
            >
              <Eye size={20} color={Colors.text.primary} />
              <Text style={styles.previewButtonText}>{t('devStoryMap.preview')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>{t('devStoryMap.previewTitle')}</Text>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowPreview(false)}
              >
                <Text style={styles.backButtonText}>{t('devStoryMap.backToEditor')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
              <StoryMap 
                chapter={createPreviewChapter()}
                onBattleSelect={(battle) => {
                  Alert.alert(
                    t('devStoryMap.battleSelectedTitle'),
                    t('devStoryMap.battleSelectedMessage', { name: t(battle.name) })
                  );
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background.card,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
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
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
  },
  generateButton: {
    backgroundColor: Colors.accent[500],
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    marginBottom: 8,
  },
  generateButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  addButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  bossButton: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  bossButtonActive: {
    backgroundColor: Colors.accent[600],
  },
  bossButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
  },
  bossButtonTextActive: {
    color: Colors.text.primary,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
  },
  previewButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  connectionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
    marginBottom: 8,
    marginTop: 8,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  removeConnectionButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: Colors.background.primary,
  },
  addConnectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  addConnectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
    marginLeft: 4,
  },
});
