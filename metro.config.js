const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add .cjs to source extensions to handle Firebase's CommonJS modules
defaultConfig.resolver.sourceExts.push('cjs');

// Disable package.json exports field handling to avoid conflicts with Firebase SDK in Expo SDK 53
defaultConfig.resolver.unstable_enablePackageExports = false;

// Configure minifier to drop console statements in production builds
defaultConfig.transformer.minifierConfig = {
  keep_fnames: false,
  mangle: true,
  compress: {
    drop_console: true, // Remove console.log, console.warn, etc. in production
  },
};

module.exports = defaultConfig;