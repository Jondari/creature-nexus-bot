import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Notification identifier for pack notifications
const PACK_NOTIFICATION_ID = 'free-pack-ready';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export class NotificationService {
  private static hasRequestedPermission = false;

  /**
   * Request notification permissions with graceful handling
   */
  static async requestPermission(): Promise<NotificationPermissionStatus> {
    try {
      // Mark that we've requested permission to avoid nagging
      this.hasRequestedPermission = true;

      // On web, use browser notification API
      if (Platform.OS === 'web') {
        return this.requestWebNotificationPermission();
      }

      // On mobile, use expo-notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return {
          granted: true,
          canAskAgain: false,
          status: 'granted'
        };
      }

      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
          allowDisplayInCarPlay: false,
          allowCriticalAlerts: false,
          providesAppNotificationSettings: false,
          allowProvisional: false,
          allowAnnouncements: false,
        },
      });

      return {
        granted: status === 'granted',
        canAskAgain: status === 'undetermined',
        status: status as 'granted' | 'denied' | 'undetermined'
      };
    } catch (error) {
      if (__DEV__) {
        console.error('Error requesting notification permissions:', error);
      }
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }
  }

  /**
   * Request web notification permission
   */
  private static async requestWebNotificationPermission(): Promise<NotificationPermissionStatus> {
    if (!('Notification' in window)) {
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied'
      };
    }

    const permission = await Notification.requestPermission();
    
    return {
      granted: permission === 'granted',
      canAskAgain: permission === 'default',
      status: permission === 'granted' ? 'granted' : 
              permission === 'default' ? 'undetermined' : 'denied'
    };
  }

  /**
   * Check if permission has been granted
   */
  static async isPermissionGranted(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return 'Notification' in window && Notification.permission === 'granted';
      }

      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      if (__DEV__) {
        console.error('Error checking notification permissions:', error);
      }
      return false;
    }
  }

  /**
   * Check if we should ask for permission (haven't asked before)
   */
  static shouldRequestPermission(): boolean {
    return !this.hasRequestedPermission;
  }

  /**
   * Schedule a notification for when the free pack is ready
   */
  static async schedulePackNotification(nextPackAvailableTime: Date): Promise<boolean> {
    try {
      const hasPermission = await this.isPermissionGranted();
      if (!hasPermission) {
        if (__DEV__) {
          console.log('Notification permission not granted, skipping pack notification');
        }
        return false;
      }

      // Cancel any existing pack notifications
      await this.cancelPackNotifications();

      const now = new Date();
      const timeUntilPack = nextPackAvailableTime.getTime() - now.getTime();

      // Don't schedule if the time has already passed
      if (timeUntilPack <= 0) {
        return false;
      }

      const title = process.env.EXPO_PUBLIC_PACK_READY_NOTIFICATION_TITLE;
      const body = process.env.EXPO_PUBLIC_PACK_READY_NOTIFICATION_BODY;

      if (Platform.OS === 'web') {
        return this.scheduleWebNotification(timeUntilPack, title, body);
      }

      // Schedule mobile notification
      await Notifications.scheduleNotificationAsync({
        identifier: PACK_NOTIFICATION_ID,
        content: {
          title,
          body,
          sound: true,
          data: {
            type: 'pack_ready',
            scheduledFor: nextPackAvailableTime.toISOString(),
          },
        },
        trigger: {
          seconds: Math.floor(timeUntilPack / 1000),
        },
      });

      if (__DEV__) {
        console.log(`Pack notification scheduled for ${nextPackAvailableTime.toLocaleString()}`);
      }

      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error scheduling pack notification:', error);
      }
      return false;
    }
  }

  /**
   * Schedule web notification using setTimeout
   */
  private static scheduleWebNotification(delayMs: number, title: string, body: string): boolean {
    try {
      // Clear any existing timeout
      if ((globalThis as any).packNotificationTimeout) {
        clearTimeout((globalThis as any).packNotificationTimeout);
      }

      // Schedule new notification
      (globalThis as any).packNotificationTimeout = setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          const iconAsset = require('../assets/images/icon.png');
          new Notification(title, {
            body,
            icon: typeof iconAsset === 'string' ? iconAsset : iconAsset.default || iconAsset.uri,
            tag: PACK_NOTIFICATION_ID,
            requireInteraction: false,
          });
        }
      }, delayMs);

      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error scheduling web notification:', error);
      }
      return false;
    }
  }

  /**
   * Cancel all pack-related notifications
   */
  static async cancelPackNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Clear web notification timeout
        if ((globalThis as any).packNotificationTimeout) {
          clearTimeout((globalThis as any).packNotificationTimeout);
          (globalThis as any).packNotificationTimeout = null;
        }
        return;
      }

      // Cancel mobile notifications
      await Notifications.cancelScheduledNotificationAsync(PACK_NOTIFICATION_ID);
      
      if (__DEV__) {
        console.log('Cancelled pack notifications');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error cancelling pack notifications:', error);
      }
    }
  }

  /**
   * Handle notification tap/click - navigate to home screen
   */
  static setupNotificationHandlers(navigation?: any): void {
    if (Platform.OS === 'web') {
      // Web notification click handling is limited
      return;
    }

    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) {
        console.log('Notification received:', notification);
      }
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      const { notification } = response;
      const { type } = notification.request.content.data || {};

      if (type === 'pack_ready' && navigation) {
        // Navigate to home screen where pack opening is available
        navigation.navigate('index');
      }

      if (__DEV__) {
        console.log('Notification tapped:', notification);
      }
    });
  }

  /**
   * Get time until next free pack is available
   */
  static getNextPackTime(lastPackOpenedTimestamp: number | null): Date | null {
    if (!lastPackOpenedTimestamp) {
      return null; // Can open immediately
    }

    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    const nextPackTime = new Date(lastPackOpenedTimestamp + twelveHoursInMs);
    
    // If time has already passed, can open immediately
    if (nextPackTime.getTime() <= Date.now()) {
      return null;
    }

    return nextPackTime;
  }

  /**
   * Schedule notification after pack opening
   */
  static async scheduleNextPackNotification(lastPackOpenedTimestamp: number): Promise<boolean> {
    const nextPackTime = this.getNextPackTime(lastPackOpenedTimestamp);
    
    if (!nextPackTime) {
      return false; // No need to schedule, pack is already available
    }

    return await this.schedulePackNotification(nextPackTime);
  }
}