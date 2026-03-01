import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, Line } from 'react-native-svg';
import { StoryBattle, StoryChapter } from '@/data/storyMode';
import Colors from '@/constants/Colors';
import { t } from '@/utils/i18n';
import { useAnchorRegister } from '@/context/AnchorsContext';
import { COMMON_ANCHORS } from '@/types/scenes';

interface StoryMapProps {
  chapter: StoryChapter;
  onBattleSelect: (battle: StoryBattle) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MAP_WIDTH = screenWidth - 40;
const MAP_HEIGHT = screenHeight * 0.6;
const isPortrait = screenHeight > screenWidth;
const aspectRatio = MAP_WIDTH / MAP_HEIGHT;

export default function StoryMap({ chapter, onBattleSelect }: StoryMapProps) {
  // Recreate per-node animated values whenever the chapter changes
  const animatedValues = useMemo<Record<string, Animated.Value>>(() => {
    const map: Record<string, Animated.Value> = {};
    chapter.battles.forEach(b => {
      map[String(b.id)] = new Animated.Value(0); // appear from 0 -> 1
    });
    return map;
  }, [chapter.id]);

  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const firstAccessibleBattleId = useMemo(() => {
    if (!chapter || !chapter.battles) return undefined;
    const accessible = chapter.battles.find(b => b.isAccessible);
    return (accessible ?? chapter.battles[0])?.id;
  }, [chapter]);

  const battleAnchorRef = useRef<TouchableOpacity | null>(null);
  useAnchorRegister(COMMON_ANCHORS.BATTLE_NODE, battleAnchorRef, [chapter.id, firstAccessibleBattleId]);

  useEffect(() => {
    // Start pulsing animation for accessible battles
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    loopRef.current.start();
    return () => {
      loopRef.current?.stop();
    };
  }, [chapter.id]);

  useEffect(() => {
    // Animate node appearances
    chapter.battles.forEach((battle, index) => {
      const v = animatedValues[String(battle.id)];
      if (v) {
        Animated.timing(v, {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [animatedValues, chapter.id, chapter.battles]);

  const getNodeColor = (battle: StoryBattle): string => {
    if (battle.isCompleted) return '#FFD700'; // Gold
    if (battle.isAccessible) return chapter.colorTheme.primary;
    return Colors.neutral[600]; // Dark gray for inaccessible
  };

  const getNodeSize = (battle: StoryBattle): number => {
    if (battle.isBoss) return 25;
    return 15;
  };

  const renderConnections = () => {
    return chapter.battles.map(battle => 
      battle.connections.map(connectionId => {
        const connectedBattle = chapter.battles.find(b => b.id === connectionId);
        if (!connectedBattle) return null;

        const x1 = (battle.x / 100) * MAP_WIDTH;
        const y1 = (battle.y / 100) * MAP_HEIGHT;
        const x2 = (connectedBattle.x / 100) * MAP_WIDTH;
        const y2 = (connectedBattle.y / 100) * MAP_HEIGHT;

        const isActive = battle.isCompleted;
        
        return (
          <Line
            key={`${battle.id}-${connectionId}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isActive ? chapter.colorTheme.accent : Colors.neutral[700]}
            strokeWidth={isActive ? 3 : 1}
            strokeOpacity={isActive ? 0.8 : 0.4}
            strokeDasharray={isActive ? "0" : "5,5"}
          />
        );
      })
    ).flat();
  };

  const renderNodes = () => {
    return chapter.battles.map(battle => {
      const x = (battle.x / 100) * MAP_WIDTH;
      const y = (battle.y / 100) * MAP_HEIGHT;
      const nodeSize = getNodeSize(battle);
      const nodeColor = getNodeColor(battle);

      return (
        <Animated.View
          key={String(battle.id)}
          style={[
            styles.nodeContainer,
            {
              left: x - nodeSize * (battle.isBoss ? 1.6 : 2.5),
              top: y - nodeSize,
              opacity: (() => {
                const v = animatedValues[String(battle.id)];
                return v ? v : 1;
              })(),
              transform: [
                {
                  scale: (() => {
                    const v = animatedValues[String(battle.id)];
                    return v ? v.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }) : 1;
                  })()
                }
              ]
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => battle.isAccessible && onBattleSelect(battle)}
            disabled={!battle.isAccessible}
            style={styles.nodeButton}
            ref={battle.id === firstAccessibleBattleId ? battleAnchorRef : undefined}
          >
            {battle.isBoss ? (
              <Animated.View
                style={[
                  styles.bossNode,
                  {
                    opacity: battle.isAccessible ? pulseAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }) : 0.4,
                  }
                ]}
              >
                <LinearGradient
                  colors={[nodeColor, Colors.background.primary]}
                  style={[styles.bossNodeGradient, { width: nodeSize * 2, height: nodeSize * 2 }]}
                  start={{ x: 0.5, y: 0.5 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.bossNodeInner} />
                </LinearGradient>
              </Animated.View>
            ) : (
              <Animated.View
                style={[
                  styles.regularNode,
                  {
                    width: nodeSize * 2,
                    height: nodeSize * 2,
                    backgroundColor: nodeColor,
                    opacity: battle.isAccessible ? pulseAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }) : 0.4,
                  }
                ]}
              />
            )}
            
            {battle.isCompleted && (
              <View style={styles.completedIndicator}>
                <Text style={styles.completedText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={[
            styles.nodeLabel,
            { color: battle.isAccessible ? Colors.text.primary : Colors.text.secondary }
          ]}>
            {t(battle.name)}
          </Text>
        </Animated.View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Holographic grid background */}
      <View style={styles.gridBackground}>
        {/* Constellation background */}
        <Svg width={MAP_WIDTH} height={MAP_HEIGHT} style={styles.constellationSvg}>
          {/* Generate constellation stars */}
          {Array.from({length: 25}).map((_, i) => (
            <Circle
              key={`star-${i}`}
              cx={Math.random() * MAP_WIDTH}
              cy={Math.random() * MAP_HEIGHT}
              r={Math.random() * 1.5 + 0.5}
              fill={chapter.colorTheme.accent}
              opacity={Math.random() * 0.6 + 0.2}
            />
          ))}
          {/* Generate constellation connections */}
          {Array.from({length: 15}).map((_, i) => {
            const x1 = Math.random() * MAP_WIDTH;
            const y1 = Math.random() * MAP_HEIGHT;
            const x2 = x1 + (Math.random() - 0.5) * 100;
            const y2 = y1 + (Math.random() - 0.5) * 100;
            return (
              <Line
                key={`constellation-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={chapter.colorTheme.secondary}
                strokeWidth={0.5}
                strokeOpacity={0.1}
              />
            );
          })}
        </Svg>

        
        {/* Connection lines without perspective */}
        <Svg width={MAP_WIDTH} height={MAP_HEIGHT} style={styles.connectionSvg}>
          <Defs>
            <RadialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={chapter.colorTheme.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={chapter.colorTheme.secondary} stopOpacity="0.3" />
            </RadialGradient>
          </Defs>
          
          {/* Render connection lines */}
          {renderConnections()}
        </Svg>
        
        {/* Animated grid pattern */}
        <View style={styles.gridLines} />
      </View>

      {/* Battle nodes */}
      <View style={styles.nodeLayer}>
        {renderNodes()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    position: 'relative',
    marginHorizontal: 20,
  },
  gridBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  gridSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: [
      { perspective: 1000 },
      { rotateX: '-10deg' },
      { rotateY: '3deg' }
    ],
  },
  constellationSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.6,
  },
  connectionSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[600],
  },
  nodeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  nodeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  regularNode: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.background.primary,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bossNode: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossNodeGradient: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  bossNodeInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.text.primary,
  },
  completedIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.background.primary,
  },
  nodeLabel: {
    marginTop: 8,
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    maxWidth: 80,
  },
});
