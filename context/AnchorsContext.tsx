/**
 * Anchors Context
 * 
 * Provides a system for registering UI elements that can be highlighted
 * by the Scenes Engine. Screens register "anchors" (important UI areas)
 * that scenes can then highlight for tutorials and narrative focus.
 */

import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { findNodeHandle, UIManager, Platform } from 'react-native';
import type { AnchorRect, AnchorMeasureFn, AnchorsAPI } from '@/types/scenes';

// Create the context
const AnchorsContext = createContext<AnchorsAPI | null>(null);

// Provider component
export const AnchorsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const anchorsRef = useRef<Map<string, AnchorMeasureFn>>(new Map());
  const debugRef = useRef<Set<string>>(new Set()); // Track registered anchors for debugging

  const api: AnchorsAPI = {
    register: useCallback((id: string, measure: AnchorMeasureFn) => {
      anchorsRef.current.set(id, measure);
      debugRef.current.add(id);
      
      if (__DEV__) {
        console.log(`[Anchors] Registered anchor: ${id}`);
      }
    }, []),

    unregister: useCallback((id: string) => {
      anchorsRef.current.delete(id);
      debugRef.current.delete(id);
      
      if (__DEV__) {
        console.log(`[Anchors] Unregistered anchor: ${id}`);
      }
    }, []),

    getRect: useCallback(async (id: string): Promise<AnchorRect | null> => {
      const measureFn = anchorsRef.current.get(id);
      if (!measureFn) {
        if (__DEV__) {
          console.warn(`[Anchors] Anchor not found: ${id}. Available: ${Array.from(debugRef.current).join(', ')}`);
        }
        return null;
      }

      try {
        const rect = await measureFn();
        if (__DEV__ && rect) {
          console.log(`[Anchors] Measured ${id}:`, rect);
        }
        return rect;
      } catch (error) {
        if (__DEV__) {
          console.error(`[Anchors] Error measuring ${id}:`, error);
        }
        return null;
      }
    }, []),

    getAllAnchors: useCallback(() => {
      return Array.from(debugRef.current);
    }, []),
  };

  return (
    <AnchorsContext.Provider value={api}>
      {children}
    </AnchorsContext.Provider>
  );
};

// Hook to access the anchors API
export const useAnchors = (): AnchorsAPI => {
  const context = useContext(AnchorsContext);
  if (!context) {
    throw new Error('useAnchors must be used within an AnchorsProvider');
  }
  return context;
};

// Hook to register an anchor from a ref
export const useAnchorRegister = (id: string, ref: React.RefObject<any>, dependencies: any[] = []) => {
  const anchors = useAnchors();

  useEffect(() => {
    // Always register the anchor, even if ref.current is not yet set.
    // The measure function will return null until the node is available and laid out.
    const measureFn: AnchorMeasureFn = () => {
      return new Promise((resolve) => {
        const current: any = ref.current;
        if (!current) {
          resolve(null);
          return;
        }

        if (Platform.OS === 'web') {
          try {
            // Prefer DOM API when available (react-native-web)
            if (typeof current.getBoundingClientRect === 'function') {
              const r = current.getBoundingClientRect();
              // Scene overlay uses position: fixed on web, so viewport coords are correct
              resolve({ x: r.left, y: r.top, width: r.width, height: r.height });
              return;
            }
            // Fallback: try component.measure if exposed
            if (typeof current.measure === 'function') {
              current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                resolve({ x: pageX ?? x, y: pageY ?? y, width, height });
              });
              return;
            }
          } catch (e) {
            if (__DEV__) console.warn('[Anchors] Web measure failed for', id, e);
          }
          resolve(null);
          return;
        }

        // Native platforms
        const node = findNodeHandle(current);
        if (!node) {
          resolve(null);
          return;
        }
        UIManager.measure(node, (x, y, width, height, pageX, pageY) => {
          resolve({ x: pageX, y: pageY, width, height });
        });
      });
    };

    anchors.register(id, measureFn);

    return () => {
      anchors.unregister(id);
    };
  }, [anchors, id, ref, ...dependencies]);
};

// Hook to register an anchor with custom measure function
export const useCustomAnchor = (id: string, measureFn: AnchorMeasureFn, dependencies: any[] = []) => {
  const anchors = useAnchors();

  useEffect(() => {
    anchors.register(id, measureFn);

    return () => {
      anchors.unregister(id);
    };
  }, [anchors, id, measureFn, ...dependencies]);
};

// Hook to register multiple anchors from an object of refs
export const useMultipleAnchors = (anchorRefs: Record<string, React.RefObject<any>>) => {
  const anchors = useAnchors();

  useEffect(() => {
    const registeredIds: string[] = [];

    Object.entries(anchorRefs).forEach(([id, ref]) => {
      const measureFn: AnchorMeasureFn = () => {
        return new Promise((resolve) => {
          const current = ref.current;
          const node = current ? findNodeHandle(current) : null;
          if (!node) {
            resolve(null);
            return;
          }

          UIManager.measure(node, (x, y, width, height, pageX, pageY) => {
            resolve({
              x: pageX,
              y: pageY,
              width,
              height,
            });
          });
        });
      };

      anchors.register(id, measureFn);
      registeredIds.push(id);
    });

    return () => {
      registeredIds.forEach(id => anchors.unregister(id));
    };
  }, [anchors, anchorRefs]);
};

// Utility component for debugging anchors (dev only)
export const AnchorsDebugger: React.FC = () => {
  const anchors = useAnchors();
  const [isVisible, setIsVisible] = React.useState(false);
  const [anchorRects, setAnchorRects] = React.useState<Record<string, AnchorRect>>({});

  const refreshAnchors = useCallback(async () => {
    const allAnchors = anchors.getAllAnchors();
    const rects: Record<string, AnchorRect> = {};

    for (const id of allAnchors) {
      const rect = await anchors.getRect(id);
      if (rect) {
        rects[id] = rect;
      }
    }

    setAnchorRects(rects);
  }, [anchors]);

  useEffect(() => {
    if (isVisible) {
      refreshAnchors();
      const interval = setInterval(refreshAnchors, 1000);
      return () => clearInterval(interval);
    }
  }, [isVisible, refreshAnchors]);

  if (!__DEV__ || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Debug overlay showing all anchor rectangles */}
      {Object.entries(anchorRects).map(([id, rect]) => (
        <React.Fragment key={id}>
          {/* Anchor outline */}
          <div
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              border: '2px dashed #ff6b6b',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          />
          {/* Anchor label */}
          <div
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y - 20,
              backgroundColor: '#ff6b6b',
              color: 'white',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 3,
              pointerEvents: 'none',
              zIndex: 10000,
            }}
          >
            {id}
          </div>
        </React.Fragment>
      ))}
      
      {/* Debug controls */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          right: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: 10,
          borderRadius: 8,
          fontSize: 12,
          zIndex: 10001,
        }}
      >
        <button onClick={() => setIsVisible(false)} style={{ marginBottom: 8 }}>
          Hide Anchors
        </button>
        <br />
        <button onClick={refreshAnchors}>Refresh</button>
        <div style={{ marginTop: 8 }}>
          Anchors: {Object.keys(anchorRects).length}
        </div>
      </div>
    </>
  );
};

// Global function to show/hide anchors debugger (dev only)
let debuggerToggle: ((show: boolean) => void) | null = null;

export const setAnchorsDebuggerVisible = (visible: boolean) => {
  if (__DEV__ && debuggerToggle) {
    debuggerToggle(visible);
  }
};

// Development utilities
export const anchorsDevUtils = {
  // Log all registered anchors
  listAnchors: (anchors: AnchorsAPI) => {
    const allAnchors = anchors.getAllAnchors();
    console.log('[Anchors Debug] Registered anchors:', allAnchors);
    return allAnchors;
  },

  // Measure and log specific anchor
  measureAnchor: async (anchors: AnchorsAPI, id: string) => {
    const rect = await anchors.getRect(id);
    console.log(`[Anchors Debug] ${id}:`, rect);
    return rect;
  },

  // Measure all anchors
  measureAllAnchors: async (anchors: AnchorsAPI) => {
    const allAnchors = anchors.getAllAnchors();
    const results: Record<string, AnchorRect | null> = {};
    
    for (const id of allAnchors) {
      results[id] = await anchors.getRect(id);
    }
    
    console.log('[Anchors Debug] All measurements:', results);
    return results;
  },
};

export default AnchorsContext;
