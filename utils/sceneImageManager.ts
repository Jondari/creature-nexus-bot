/**
 * Scene Image Manager
 * 
 * Handles image preloading, caching, and management for the Scenes Engine.
 * Provides efficient asset loading for visual novel features.
 */

import { Image } from 'react-native';

// Image asset registry
interface ImageAsset {
  id: string;
  uri: string | number | { uri: string; width?: number; height?: number };
  type: 'background' | 'portrait' | 'overlay' | 'ui';
  preloaded: boolean;
  dimensions?: { width: number; height: number };
}

// Asset collections for organized loading
interface SceneAssetCollection {
  id: string;
  name: string;
  assets: ImageAsset[];
  preloaded: boolean;
}

class SceneImageManager {
  private assets: Map<string, ImageAsset> = new Map();
  private collections: Map<string, SceneAssetCollection> = new Map();
  private preloadPromises: Map<string, Promise<void>> = new Map();
  private debugMode: boolean = __DEV__;

  /**
   * Register a single image asset
   */
  registerAsset(asset: Omit<ImageAsset, 'preloaded'>): void {
    const fullAsset: ImageAsset = { ...asset, preloaded: false };
    this.assets.set(asset.id, fullAsset);
    
    if (this.debugMode) {
      console.log(`[SceneImageManager] Registered asset: ${asset.id}`);
    }
  }

  /**
   * Register multiple assets as a collection
   */
  registerCollection(collection: Omit<SceneAssetCollection, 'preloaded'>): void {
    const fullCollection: SceneAssetCollection = { ...collection, preloaded: false };
    
    // Register individual assets
    collection.assets.forEach(asset => {
      this.registerAsset(asset);
    });
    
    this.collections.set(collection.id, fullCollection);
    
    if (this.debugMode) {
      console.log(`[SceneImageManager] Registered collection: ${collection.id} (${collection.assets.length} assets)`);
    }
  }

  /**
   * Preload a single asset
   */
  async preloadAsset(assetId: string): Promise<void> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      console.warn(`[SceneImageManager] Asset not found: ${assetId}`);
      return;
    }

    if (asset.preloaded) {
      return; // Already preloaded
    }

    // Check if already preloading
    const existingPromise = this.preloadPromises.get(assetId);
    if (existingPromise) {
      return existingPromise;
    }

    const preloadPromise = this.performPreload(asset);
    this.preloadPromises.set(assetId, preloadPromise);
    
    try {
      await preloadPromise;
      asset.preloaded = true;
      
      if (this.debugMode) {
        console.log(`[SceneImageManager] Preloaded asset: ${assetId}`);
      }
    } catch (error) {
      console.error(`[SceneImageManager] Failed to preload asset: ${assetId}`, error);
    } finally {
      this.preloadPromises.delete(assetId);
    }
  }

  /**
   * Preload an entire collection
   */
  async preloadCollection(collectionId: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      console.warn(`[SceneImageManager] Collection not found: ${collectionId}`);
      return;
    }

    if (collection.preloaded) {
      return; // Already preloaded
    }

    const preloadPromises = collection.assets.map(asset => this.preloadAsset(asset.id));
    
    try {
      await Promise.all(preloadPromises);
      collection.preloaded = true;
      
      if (this.debugMode) {
        console.log(`[SceneImageManager] Preloaded collection: ${collectionId}`);
      }
    } catch (error) {
      console.error(`[SceneImageManager] Failed to preload collection: ${collectionId}`, error);
    }
  }

  /**
   * Get asset URI, preloading if necessary
   */
  async getAssetUri(assetId: string): Promise<string | number | { uri: string; width?: number; height?: number } | null> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      console.warn(`[SceneImageManager] Asset not found: ${assetId}`);
      return null;
    }

    if (!asset.preloaded) {
      if (this.debugMode) {
        console.log(`[SceneImageManager] getAssetUri: asset not preloaded, preloading ${assetId}`);
      }
      await this.preloadAsset(assetId);
    }

    if (this.debugMode) {
      console.log(`[SceneImageManager] getAssetUri: returning for ${assetId}:`, asset.uri);
    }
    return asset.uri;
  }

  /**
   * Check if an asset is preloaded
   */
  isAssetPreloaded(assetId: string): boolean {
    const asset = this.assets.get(assetId);
    return asset?.preloaded || false;
  }

  /**
   * Get asset dimensions
   */
  getAssetDimensions(assetId: string): { width: number; height: number } | null {
    const asset = this.assets.get(assetId);
    return asset?.dimensions || null;
  }

  /**
   * Perform the actual preloading
   */
  private async performPreload(asset: ImageAsset): Promise<void> {
    return new Promise((resolve, reject) => {
      // Handle different URI types
      if (typeof asset.uri === 'string' && asset.uri.startsWith('http')) {
        // Remote image
        Image.prefetch(asset.uri)
          .then(() => {
            // Get dimensions for remote images
            Image.getSize(
              asset.uri,
              (width, height) => {
                asset.dimensions = { width, height };
                resolve();
              },
              (error) => {
                console.warn(`[SceneImageManager] Could not get dimensions for ${asset.id}:`, error);
                resolve(); // Don't fail the preload for dimension errors
              }
            );
          })
          .catch(reject);
      } else {
        // Local asset - use require() results or asset URI
        try {
          // For local assets, we can't easily get dimensions without rendering
          // This is a limitation of React Native's Image.getSize with local assets
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    });
  }

  /**
   * Clear preloaded assets to free memory
   */
  clearPreloadedAssets(collectionId?: string): void {
    if (collectionId) {
      const collection = this.collections.get(collectionId);
      if (collection) {
        collection.assets.forEach(asset => {
          const fullAsset = this.assets.get(asset.id);
          if (fullAsset) {
            fullAsset.preloaded = false;
          }
        });
        collection.preloaded = false;
        
        if (this.debugMode) {
          console.log(`[SceneImageManager] Cleared collection: ${collectionId}`);
        }
      }
    } else {
      // Clear all assets
      this.assets.forEach(asset => {
        asset.preloaded = false;
      });
      this.collections.forEach(collection => {
        collection.preloaded = false;
      });
      
      if (this.debugMode) {
        console.log(`[SceneImageManager] Cleared all preloaded assets`);
      }
    }
  }

  /**
   * Get statistics about loaded assets
   */
  getLoadingStats(): {
    totalAssets: number;
    preloadedAssets: number;
    totalCollections: number;
    preloadedCollections: number;
  } {
    const totalAssets = this.assets.size;
    const preloadedAssets = Array.from(this.assets.values()).filter(a => a.preloaded).length;
    const totalCollections = this.collections.size;
    const preloadedCollections = Array.from(this.collections.values()).filter(c => c.preloaded).length;

    return {
      totalAssets,
      preloadedAssets,
      totalCollections,
      preloadedCollections,
    };
  }

  /**
   * Debug method to list all registered assets
   */
  debugListAssets(): void {
    if (!this.debugMode) return;

    console.log('[SceneImageManager] Registered Assets:');
    this.assets.forEach((asset, id) => {
      console.log(`  ${id}: ${asset.uri} (${asset.type}) - Preloaded: ${asset.preloaded}`);
    });

    console.log('[SceneImageManager] Collections:');
    this.collections.forEach((collection, id) => {
      console.log(`  ${id}: ${collection.name} (${collection.assets.length} assets) - Preloaded: ${collection.preloaded}`);
    });
  }
}

// Singleton instance
const sceneImageManager = new SceneImageManager();

// Predefined asset collections for common scene types

// Tutorial assets
const TUTORIAL_ASSETS: SceneAssetCollection = {
  id: 'tutorial',
  name: 'Tutorial Assets',
  preloaded: false,
  assets: [
    {
      id: 'nexus_bg',
      uri: require('@/assets/images/scene/nexus_bg.png'),
      type: 'background',
      preloaded: false,
    },
    {
      id: 'guide_portrait',
      uri: require('@/assets/images/scene/guide_portrait.png'),
      type: 'portrait',
      preloaded: false,
    },
    {
      id: 'merchant_portrait',
      uri: require('@/assets/images/scene/merchant_portrait.png'),
      type: 'portrait',
      preloaded: false,
    },
    {
      id: 'strategist_portrait',
      uri: require('@/assets/images/scene/strategist_portrait.png'),
      type: 'portrait',
      preloaded: false,
    },
    {
      id: 'nexus_welcome_bg',
      uri: require('@/assets/images/scene/nexus_welcome_bg.png'),
      type: 'background',
      preloaded: false,
    },
    {
      id: 'battle_interface_bg',
      uri: require('@/assets/images/scene/battle_tutorial.png'),
      type: 'background',
      preloaded: false,
    },
  ],
};

// Story Chapter 1 assets
const CHAPTER_1_ASSETS: SceneAssetCollection = {
  id: 'chapter_1',
  name: 'Chapter 1: Water Realm',
  preloaded: false,
  assets: [
    {
      id: 'archivist_portrait',
      uri: 'archivist_portrait.png',
      type: 'portrait',
      preloaded: false,
    },
    {
      id: 'selel_portrait',
      uri: 'selel_portrait.png',
      type: 'portrait',
      preloaded: false,
    },
    /*
    {
      id: 'water_realm_bg',
      uri: require('@/assets/images/backgrounds/water_realm.png'),
      type: 'background',
      preloaded: false,
    },
    {
      id: 'temple_of_tides',
      uri: require('@/assets/images/backgrounds/temple_tides.png'),
      type: 'background',
      preloaded: false,
    },
    */
    {
      id: 'corrupted_nixeth',
      uri: 'corrupted_nixeth.png',
      type: 'portrait',
      preloaded: false,
    },
    /*
    {
      id: 'nixeth_pure',
      uri: require('@/assets/images/portraits/nixeth_pure.png'),
      type: 'portrait',
      preloaded: false,
    },
    */
  ],
};

// UI and effects assets
const UI_EFFECTS_ASSETS: SceneAssetCollection = {
  id: 'ui_effects',
  name: 'UI and Effects',
  preloaded: false,
  assets: [
    /*
    {
      id: 'water_essence',
      uri: require('@/assets/images/effects/water_essence.png'),
      type: 'overlay',
      preloaded: false,
    },
    */
    {
      id: 'victory_bg',
      uri: require('@/assets/images/scene/victory_bg.png'),
      type: 'background',
      preloaded: false,
    },
    {
      id: 'defeat_bg',
      uri: 'defeat_bg.png',
      type: 'background',
      preloaded: false,
    },
  ],
};

// Register default collections
sceneImageManager.registerCollection(TUTORIAL_ASSETS);
sceneImageManager.registerCollection(CHAPTER_1_ASSETS);
sceneImageManager.registerCollection(UI_EFFECTS_ASSETS);

// Utility functions for scene integration
export const sceneImageUtils = {
  /**
   * Preload assets for a specific scene
   */
  preloadSceneAssets: async (sceneId: string): Promise<void> => {
    const collectionMap = {
      tutorial: ['tutorial', 'ui_effects'],
      story_chapter_1: ['chapter_1', 'ui_effects'],
    };

    const collections = collectionMap[sceneId as keyof typeof collectionMap] || [];
    
    const preloadPromises = collections.map(collectionId => 
      sceneImageManager.preloadCollection(collectionId)
    );

    await Promise.all(preloadPromises);
  },

  /**
   * Preload critical assets on app start
   */
  preloadCriticalAssets: async (): Promise<void> => {
    // Preload tutorial assets first since they're most likely to be used
    await sceneImageManager.preloadCollection('tutorial');
    
    // Preload UI effects
    await sceneImageManager.preloadCollection('ui_effects');
  },

  /**
   * Get asset URI with automatic preloading
   */
  getAssetUri: async (assetId: string): Promise<string | number | { uri: string; width?: number; height?: number } | null> => {
    return sceneImageManager.getAssetUri(assetId);
  },

  /**
   * Check if assets are ready for a scene
   */
  areSceneAssetsReady: (sceneId: string): boolean => {
    const collectionMap = {
      tutorial: ['tutorial'],
      story_chapter_1: ['chapter_1'],
    };

    const collections = collectionMap[sceneId as keyof typeof collectionMap] || [];
    
    return collections.every(collectionId => {
      const collection = sceneImageManager.collections.get(collectionId);
      return collection?.preloaded || false;
    });
  },

  /**
   * Get loading progress for scene assets
   */
  getSceneLoadingProgress: (sceneId: string): number => {
    const collectionMap = {
      tutorial: ['tutorial'],
      story_chapter_1: ['chapter_1'],
    };

    const collections = collectionMap[sceneId as keyof typeof collectionMap] || [];
    if (collections.length === 0) return 1;

    let totalAssets = 0;
    let loadedAssets = 0;

    collections.forEach(collectionId => {
      const collection = sceneImageManager.collections.get(collectionId);
      if (collection) {
        totalAssets += collection.assets.length;
        loadedAssets += collection.assets.filter(asset => 
          sceneImageManager.isAssetPreloaded(asset.id)
        ).length;
      }
    });

    return totalAssets > 0 ? loadedAssets / totalAssets : 1;
  },

  /**
   * Register additional scene assets at runtime
   */
  registerSceneAsset: (asset: Omit<ImageAsset, 'preloaded'>): void => {
    sceneImageManager.registerAsset(asset);
  },

  /**
   * Clear unused assets to free memory
   */
  clearUnusedAssets: (): void => {
    sceneImageManager.clearPreloadedAssets();
  },

  /**
   * Debug utilities
   */
  debug: {
    listAssets: () => sceneImageManager.debugListAssets(),
    getStats: () => sceneImageManager.getLoadingStats(),
  },
};

export { sceneImageManager };
export default sceneImageUtils;
