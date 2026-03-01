// Platform-specific RevenueCat service exports
import { Platform } from 'react-native';

// Import the appropriate service based on platform
if (Platform.OS === 'web') {
  // Web platform - stub implementation
  const webService = require('./RevenueCatService.web');
  module.exports = webService.default || webService;
} else {
  // Native platforms (iOS/Android) - full RevenueCat implementation
  const nativeService = require('./RevenueCatService.native');
  module.exports = nativeService.default || nativeService;
}