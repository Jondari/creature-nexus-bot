/**
 * SceneRunner Component
 * 
 * Core component that executes scene scripts and renders the visual novel overlay.
 * Handles dialog display, UI highlighting, input masking, and visual effects.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import type {
  SceneSpec,
  SceneCommand,
  SceneState,
  HighlightStyle,
  AnchorRect,
  SceneRunnerProps,
} from '@/types/scenes';
import { useAnchors } from '@/context/AnchorsContext';
import sceneImageUtils from '@/utils/sceneImageManager';
import { t } from '@/utils/i18n';

// Image source helpers (module-scope, no React hooks)
function toImageSource(u?: string | number | { uri: string; width?: number; height?: number }) {
  if (!u) return undefined as unknown as any;
  if (typeof u === 'number') return u;
  if (typeof u === 'string') return { uri: u } as any;
  return u as any;
}

async function resolveUri(u: string | number | { uri: string; width?: number; height?: number }) {
  if (typeof u === 'string') {
    const isHttp = /^https?:\/\//i.test(u);
    if (!isHttp && u.toLowerCase().endsWith('.png')) {
      const id = u.replace(/\.png$/i, '');
      try {
        const resolved = await sceneImageUtils.getAssetUri(id);
        if (resolved) return resolved as any;
      } catch (e) {
        if (__DEV__) console.warn('[SceneRunner] resolveUri error', u, e);
      }
    }
  }
  return u as any;
}

function resolveSceneText(text?: string): string | undefined {
  if (!text) return text;
  if (text.startsWith('i18n:')) {
    const key = text.slice(5).trim();
    return key ? t(key) : '';
  }
  return text;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Default highlight style
const DEFAULT_HIGHLIGHT_STYLE: HighlightStyle = {
  borderColor: '#6C63FF',
  borderWidth: 3,
  borderRadius: 12,
  shadowColor: '#6C63FF',
  shadowOpacity: 0.6,
  pulsate: true,
  glow: true,
};

export const SceneRunner: React.FC<SceneRunnerProps> = ({
  scene,
  onFinish,
  onSceneAction,
  initialState,
}) => {
  const anchors = useAnchors();
  
  // Scene execution state
  const [pc, setPc] = useState(0); // program counter
  const [labels, setLabels] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>(initialState?.flags || {});
  const [progress, setProgress] = useState<Record<string, number>>(initialState?.progress || {});
  
  // UI state
  const [dialog, setDialog] = useState<SceneState['dialog']>(null);
  const [highlight, setHighlight] = useState<SceneState['highlight']>(null);
  const [highlightTextHeight, setHighlightTextHeight] = useState(0);
  const [maskInput, setMaskInput] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);

  useEffect(() => {
    setHighlightTextHeight(0);
  }, [highlight?.text, highlight?.rect, highlight?.textPosition]);

  // Visual state
  const [background, setBackground] = useState<string | number | { uri: string; width?: number; height?: number } | undefined>(scene.backgroundImage);
  const [portraits, setPortraits] = useState<{
    left?: { uri: string | number | { uri: string; width?: number; height?: number }; mirror?: boolean };
    right?: { uri: string | number | { uri: string; width?: number; height?: number }; mirror?: boolean }
  }>({});
  const [overlays, setOverlays] = useState<Array<{
    id: string;
    uri: string | number | { uri: string; width?: number; height?: number };
    x: number;
    y: number;
    width?: number;
    height?: number;
  }>>([]);
  
  // Animation values
  const dialogOpacity = useRef(new Animated.Value(0)).current;
  const highlightPulse = useRef(new Animated.Value(1)).current;
  const highlightRetryRef = useRef<Record<string, number>>({});
  const portraitLeft = useRef(new Animated.Value(-200)).current;
  const portraitRight = useRef(new Animated.Value(200)).current;
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  
  // Build labels map on scene load
  useEffect(() => {
    const labelsMap: Record<string, number> = {};
    scene.steps.forEach((step, index) => {
      if (step.type === 'label') {
        labelsMap[step.name] = index;
      }
    });
    setLabels(labelsMap);
  }, [scene]);

  // Sync external state from SceneManager into local SceneRunner state
  useEffect(() => {
    if (initialState?.flags) {
      setFlags(initialState.flags);
    }
  }, [initialState?.flags]);

  useEffect(() => {
    if (initialState?.progress) {
      setProgress(initialState.progress);
    }
  }, [initialState?.progress]);

  // Navigation helpers
  const gotoLabel = useCallback((name: string) => {
    const labelIndex = labels[name];
    if (labelIndex !== undefined) {
      setPc(labelIndex + 1); // Skip the label itself
    } else {
      console.warn(`[SceneRunner] Label not found: ${name}`);
    }
  }, [labels]);

  const gotoStep = useCallback((stepIndex: number) => {
    setPc(Math.max(0, Math.min(stepIndex, scene.steps.length)));
  }, [scene.steps.length]);

  // Flag management
  const getFlag = useCallback((key: string): boolean => {
    return flags[key] || false;
  }, [flags]);

  const setFlagValue = useCallback((key: string, value: boolean) => {
    setFlags(prev => {
      if (prev[key] !== value) {
        onSceneAction?.('flag_changed', { key, oldValue: prev[key] || false, newValue: value });
      }
      return { ...prev, [key]: value };
    });
  }, [onSceneAction]);

  // Progress management
  const getProgressValue = useCallback((key: string): number => {
    return progress[key] || 0;
  }, [progress]);

  const setProgressValue = useCallback((key: string, value: number) => {
    setProgress(prev => {
      if (prev[key] !== value) {
        onSceneAction?.('progress_changed', { key, oldValue: prev[key] || 0, newValue: value });
      }
      return { ...prev, [key]: value };
    });
  }, [onSceneAction]);

  // Animation helpers
  const showDialog = useCallback(() => {
    Animated.timing(dialogOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [dialogOpacity]);

  const hideDialog = useCallback(() => {
    Animated.timing(dialogOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [dialogOpacity]);

  const animatePortrait = useCallback((side: 'left' | 'right', show: boolean) => {
    const animValue = side === 'left' ? portraitLeft : portraitRight;
    const toValue = show ? 0 : (side === 'left' ? -200 : 200);
    
    Animated.spring(animValue, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [portraitLeft, portraitRight]);

  const startHighlightPulse = useCallback(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(highlightPulse, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(highlightPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start(() => {
        if (highlight?.style?.pulsate) {
          pulse();
        }
      });
    };
    pulse();
  }, [highlightPulse, highlight]);

  // Main command execution
  const executeCommand = useCallback(async (cmd: SceneCommand) => {
    onSceneAction?.('scene_step', { sceneId: scene.id, stepIndex: pc, command: cmd });

    switch (cmd.type) {
      case 'label':
        // Labels are no-op, advance immediately
        setPc(pc + 1);
        break;

      case 'say': {
        const resolvedText = resolveSceneText(cmd.text);
        const resolvedSpeaker = resolveSceneText(cmd.speaker);
        setDialog({
          speaker: resolvedSpeaker,
          text: resolvedText,
          portrait: cmd.portrait,
          choices: null,
        });
        setIsWaitingForInput(true);
        showDialog();
        break;
      }

      case 'choice': {
        const resolvedChoices = cmd.choices.map(choice => ({
          ...choice,
          text: resolveSceneText(choice.text) ?? '',
        }));
        setDialog(prev => ({
          ...prev,
          choices: resolvedChoices,
        }));
        setIsWaitingForInput(true);
        // Keep the panel visible even if no preceding "say" command ran
        showDialog();
        break;
      }

      case 'wait': {
        setTimeout(() => {
          setPc(pc + 1);
        }, cmd.ms);
        break;
      }

      case 'setFlag': {
        setFlagValue(cmd.key, cmd.value);
        setPc(pc + 1);
        break;
      }

      case 'setProgress': {
        setProgressValue(cmd.key, cmd.value);
        setPc(pc + 1);
        break;
      }

      case 'if': {
        const condition = getFlag(cmd.flag);
        if (condition && cmd.then) {
          gotoLabel(cmd.then);
        } else if (!condition && cmd.else) {
          gotoLabel(cmd.else);
        } else {
          setPc(pc + 1);
        }
        break;
      }

      case 'checkProgress': {
        const value = getProgressValue(cmd.key);
        const meetsCondition = 
          (cmd.min === undefined || value >= cmd.min) &&
          (cmd.max === undefined || value <= cmd.max);
        
        if (meetsCondition && cmd.then) {
          gotoLabel(cmd.then);
        } else if (!meetsCondition && cmd.else) {
          gotoLabel(cmd.else);
        } else {
          setPc(pc + 1);
        }
        break;
      }

      case 'goto': {
        gotoLabel(cmd.label);
        break;
      }

      case 'highlight': {
        try {
          const rect = await anchors.getRect(cmd.anchorId);
          if (!rect) {
            const key = `${scene.id}:${cmd.anchorId}:${pc}`;
            const attempts = (highlightRetryRef.current[key] || 0) + 1;
            highlightRetryRef.current[key] = attempts;
            // Retry up to ~6s (30 * 200ms)
            if (attempts <= 30) {
              if (__DEV__) console.log(`[SceneRunner] Waiting for anchor ${cmd.anchorId} (attempt ${attempts})`);
              setTimeout(() => {
                // re-run same step
                setPc((prev) => prev);
              }, 200);
              break;
            } else {
              if (__DEV__) console.warn(`[SceneRunner] Anchor not found after retries: ${cmd.anchorId}. Skipping highlight.`);
              setPc(pc + 1);
              break;
            }
          }
          const style = { ...DEFAULT_HIGHLIGHT_STYLE, ...cmd.style };
          const textPosition = cmd.textPosition || 'bottom';
          setHighlight({ rect, text: resolveSceneText(cmd.text), style, maskInput: cmd.maskInput, textPosition });
          if (cmd.maskInput) {
            setMaskInput(true);
          } else {
            setMaskInput(false);
          }
          if (style.pulsate) startHighlightPulse();
          onSceneAction?.('anchor_highlighted', { anchorId: cmd.anchorId, sceneId: scene.id });
          setIsWaitingForInput(true);
        } catch (error) {
          console.warn(`[SceneRunner] Failed to highlight anchor ${cmd.anchorId}:`, error);
          setPc(pc + 1);
        }
        break;
      }

      case 'maskInput': {
        setMaskInput(cmd.enabled);
        setPc(pc + 1);
        break;
      }

      case 'showHint': {
        // Simple hint implementation - could be enhanced
        let rect: AnchorRect | null = null;
        if (cmd.anchorId) {
          rect = await anchors.getRect(cmd.anchorId);
        }
        
        setHighlight({
          rect,
          text: resolveSceneText(cmd.text),
          style: { ...DEFAULT_HIGHLIGHT_STYLE, backgroundColor: 'rgba(0,0,0,0.8)' },
          maskInput: false,
        });
        
        // Auto-dismiss after duration
        setTimeout(() => {
          setHighlight(null);
          setPc(pc + 1);
        }, cmd.duration || 3000);
        break;
      }

      case 'setBackground': {
        if (cmd.transition === 'fade') {
          Animated.timing(backgroundOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            if (__DEV__) console.log('[SceneRunner] setBackground requested (fade):', cmd.uri);
            resolveUri(cmd.uri).then((r) => {
              if (__DEV__) console.log('[SceneRunner] setBackground resolved (fade):', r);
              setBackground(r);
            });
            Animated.timing(backgroundOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          });
        } else {
          (async () => {
            if (__DEV__) console.log('[SceneRunner] setBackground requested (no fade):', cmd.uri);
            const r = await resolveUri(cmd.uri);
            if (__DEV__) console.log('[SceneRunner] setBackground resolved (no fade):', r);
            setBackground(r);
          })();
        }
        setPc(pc + 1);
        break;
      }

      case 'showPortrait': {
        (async () => {
          const r = await resolveUri(cmd.uri);
          if (__DEV__) console.log('[SceneRunner] showPortrait', cmd.side, 'uri:', cmd.uri, 'resolved:', r, 'mirror:', cmd.mirror);
          setPortraits(prev => ({ ...prev, [cmd.side]: { uri: r, mirror: cmd.mirror } }));
        })();
        animatePortrait(cmd.side, true);
        setPc(pc + 1);
        break;
      }

      case 'hidePortrait': {
        animatePortrait(cmd.side, false);
        setTimeout(() => {
          setPortraits(prev => ({ ...prev, [cmd.side]: undefined }));
        }, 300);
        setPc(pc + 1);
        break;
      }

      case 'imageOverlay': {
        const overlayId = `overlay_${Date.now()}`;
        (async () => {
          const r = await resolveUri(cmd.uri);
          if (__DEV__) console.log('[SceneRunner] imageOverlay uri:', cmd.uri, 'resolved:', r);
          setOverlays(prev => [...prev, {
            id: overlayId,
            uri: r,
            x: cmd.x,
            y: cmd.y,
            width: cmd.width,
            height: cmd.height,
          }]);
        })();
        
        if (cmd.duration) {
          setTimeout(() => {
            setOverlays(prev => prev.filter(o => o.id !== overlayId));
          }, cmd.duration);
        }
        
        setPc(pc + 1);
        break;
      }

      // Audio stubs
      case 'playSound': {
        if (__DEV__) console.log('[SceneRunner] playSound (stub):', cmd.uri, 'loop:', cmd.loop);
        setPc(pc + 1);
        break;
      }
      case 'playMusic': {
        if (__DEV__) console.log('[SceneRunner] playMusic (stub):', cmd.uri, 'loop:', cmd.loop, 'fadeIn:', cmd.fadeIn);
        setPc(pc + 1);
        break;
      }
      case 'stopMusic': {
        if (__DEV__) console.log('[SceneRunner] stopMusic (stub):', 'fadeOut:', cmd.fadeOut);
        setPc(pc + 1);
        break;
      }

      case 'triggerBattle':
      case 'navigateTo': {
        onSceneAction?.('scene_action', { type: cmd.type, data: cmd });
        onFinish();
        break;
      }

      case 'triggerReward': {
        // Stub: emit action so host app can show reward UI, then continue
        onSceneAction?.('scene_action', { type: cmd.type, data: cmd });
        setPc(pc + 1);
        break;
      }

      case 'end': {
        onFinish();
        break;
      }

      default: {
        console.warn(`[SceneRunner] Unknown command type:`, cmd);
        setPc(pc + 1);
        break;
      }
    }
  }, [
    scene, pc, anchors, getFlag, setFlagValue, getProgressValue, setProgressValue,
    gotoLabel, showDialog, animatePortrait, onSceneAction, onFinish
  ]);

  // Execute current command
  useEffect(() => {
    if (pc >= scene.steps.length) {
      onFinish();
      return;
    }

    const cmd = scene.steps[pc];
    if (cmd) {
      executeCommand(cmd);
    }
  }, [pc, scene.steps, executeCommand, onFinish]);

  // Handle user interactions
  const onDialogTap = useCallback(() => {
    // Safety check: ignore full-screen taps while choices are visible
    if (dialog?.choices && dialog.choices.length > 0) {
      return;
    }
    if (dialog && !dialog.choices) {
      if (__DEV__) console.log('[SceneRunner] onDialogTap advancing');
      hideDialog();
      setDialog(null);
      setIsWaitingForInput(false);
      setPc(pc + 1);
      onSceneAction?.('user_input', { inputType: 'tap' });
    }
  }, [dialog, hideDialog, pc, onSceneAction]);

  const onChoiceSelect = useCallback((choiceId: string, choice: any) => {
    if (__DEV__) console.log('[SceneRunner] onChoiceSelect', choiceId, choice);
    hideDialog();
    setDialog(null);
    setIsWaitingForInput(false);
    
    // Apply choice flags
    if (choice.setFlags) {
      Object.entries(choice.setFlags).forEach(([key, value]) => {
        setFlagValue(key, value as boolean);
      });
    }
    
    // Navigate
    if (choice.goto) {
      gotoLabel(choice.goto);
    } else {
      setPc(pc + 1);
    }
    
    onSceneAction?.('choice_selected', { choiceId, sceneId: scene.id });
  }, [hideDialog, setFlagValue, gotoLabel, pc, onSceneAction, scene.id]);

  const onHighlightTap = useCallback(() => {
    if (highlight) {
      setHighlight(null);
      setMaskInput(false);
      setIsWaitingForInput(false);
      setPc(pc + 1);
      onSceneAction?.('user_input', { inputType: 'tap' });
    }
  }, [highlight, pc, onSceneAction]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isWaitingForInput) {
        // Allow skipping current step
        if (dialog && !dialog.choices) {
          onDialogTap();
        } else if (highlight) {
          onHighlightTap();
        }
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isWaitingForInput, dialog, highlight, onDialogTap, onHighlightTap]);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 100000,
          elevation: 100000,
          // On web, use "fixed" to avoid creating extra scrollable space
          position: Platform.OS === 'web' ? 'fixed' as any : 'absolute' as any,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Background */}
      {background && (
        <View style={styles.backgroundContainer} pointerEvents="none">
          <Animated.Image
            source={toImageSource(background)}
            style={[StyleSheet.absoluteFill, { opacity: backgroundOpacity, width: '100%', height: '100%' }]}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Input mask */}
      {maskInput && (
        <View 
          style={StyleSheet.absoluteFillObject} 
          pointerEvents="auto"
        />
      )}

      {/* Portraits */}
      {portraits.left && (
        <Animated.Image
          source={toImageSource(portraits.left.uri)}
          style={[
            styles.portraitLeft,
            { transform: [{ translateX: portraitLeft }, { scaleX: portraits.left.mirror ? -1 : 1 }] }
          ]}
          resizeMode="contain"
        />
      )}

      {portraits.right && (
        <Animated.Image
          source={toImageSource(portraits.right.uri)}
          style={[
            styles.portraitRight,
            { transform: [{ translateX: portraitRight }, { scaleX: portraits.right.mirror ? -1 : 1 }] }
          ]}
          resizeMode="contain"
        />
      )}

      {/* Image overlays */}
      {overlays.map((overlay) => (
        <Image
          key={overlay.id}
          source={toImageSource(overlay.uri)}
          style={{
            position: 'absolute',
            left: overlay.x,
            top: overlay.y,
            width: overlay.width || 100,
            height: overlay.height || 100,
          }}
          resizeMode="contain"
        />
      ))}

      {/* Highlight overlay */}
      {highlight?.rect && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={onHighlightTap}
          style={StyleSheet.absoluteFill}
          pointerEvents="auto"
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: highlight.rect.x,
                top: highlight.rect.y,
                width: highlight.rect.width,
                height: highlight.rect.height,
                borderWidth: highlight.style?.borderWidth || DEFAULT_HIGHLIGHT_STYLE.borderWidth,
                borderColor: highlight.style?.borderColor || DEFAULT_HIGHLIGHT_STYLE.borderColor,
                borderRadius: highlight.style?.borderRadius || DEFAULT_HIGHLIGHT_STYLE.borderRadius,
                backgroundColor: highlight.style?.backgroundColor,
              },
              highlight.style?.glow && {
                shadowColor: highlight.style?.shadowColor || DEFAULT_HIGHLIGHT_STYLE.shadowColor,
                shadowOpacity: highlight.style?.shadowOpacity || DEFAULT_HIGHLIGHT_STYLE.shadowOpacity,
                shadowRadius: 10,
                elevation: 10,
              },
              highlight.style?.pulsate && {
                transform: [{ scale: highlightPulse }]
              }
            ]}
            pointerEvents="none"
          />

          {highlight.text && highlight.rect && (
            <View style={[
              styles.highlightText,
              {
                top: (() => {
                  const measured = highlightTextHeight || 0;
                  if (highlight.textPosition === 'top') {
                    return Math.max(12, (highlight.rect?.y || 0) - measured - 12);
                  }
                  const bottomCandidate = (highlight.rect?.y || 0) + (highlight.rect?.height || 0) + 12;
                  return Math.min(
                    screenHeight - measured - 12,
                    bottomCandidate
                  );
                })(),
                left: Math.max(12, Math.min(highlight.rect.x, screenWidth - 200)),
              }
            ]}
            onLayout={({ nativeEvent }) => {
              const h = nativeEvent.layout.height;
              if (Math.abs(h - highlightTextHeight) > 0.5) {
                setHighlightTextHeight(h);
              }
            }}
          >
              <Text style={styles.highlightTextContent}>
                {highlight.text}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Dialog overlay */}
      {dialog && (
        <Animated.View
          style={[styles.dialogOverlay, { opacity: dialogOpacity }]}
          pointerEvents="auto"
        >
          {dialog.choices ? (
            <View style={styles.dialogTouchArea}>
              <View style={styles.dialogBox}>
                {dialog.speaker && (
                  <Text style={styles.speakerName}>{dialog.speaker}</Text>
                )}
                {dialog.text && (
                  <Text style={styles.dialogText}>{dialog.text}</Text>
                )}
                <View style={styles.choicesContainer}>
                  {dialog.choices.map((choice) => (
                    <TouchableOpacity
                      key={choice.id}
                      style={styles.choiceButton}
                      onPress={() => onChoiceSelect(choice.id, choice)}
                    >
                      <Text style={styles.choiceText}>{choice.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
        ) : (
          <TouchableOpacity
            activeOpacity={1}
            onPress={onDialogTap}
            style={styles.dialogTouchArea}
          >
              <View style={styles.dialogBox}>
                {dialog.speaker && (
                  <Text style={styles.speakerName}>{dialog.speaker}</Text>
                )}
                {dialog.text && (
                  <Text style={styles.dialogText}>{dialog.text}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  portraitLeft: {
    position: 'absolute',
    left: 20,
    bottom: 100,
    width: 180,
    height: 240,
    // Sits below the dialog box (100001) but above the background
    zIndex: 100000,
  },
  
  portraitRight: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 180,
    height: 240,
    // Sits below the dialog box (100001) but above the background
    zIndex: 100000,
  },
  
  highlightText: {
    position: 'absolute',
    maxWidth: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    padding: 12,
  },
  
  highlightTextContent: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 100001,
  },
  
  dialogTouchArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  dialogBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    margin: 12,
    borderRadius: 12,
    padding: 20,
    minHeight: 80,
  },
  
  speakerName: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  
  dialogText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  
  choicesContainer: {
    gap: 12,
  },
  
  choiceButton: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 8,
    padding: 12,
  },
  
  choiceText: {
    color: '#6C63FF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default SceneRunner;
