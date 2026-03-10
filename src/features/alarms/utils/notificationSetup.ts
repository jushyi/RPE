/**
 * Notification setup utilities for alarm infrastructure.
 * Handles permissions, Android channels, and action categories.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ALARM_CHANNEL_ID, NUDGE_CHANNEL_ID, ALARM_CATEGORY_ID } from '../constants';

/**
 * Request notification permissions. Only works on physical devices.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false,
    },
  });

  return status === 'granted';
}

/**
 * Set up Android notification channels for alarms and nudges.
 * No-op on iOS.
 */
export async function setupAlarmChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Workout Alarms',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
  });

  await Notifications.setNotificationChannelAsync(NUDGE_CHANNEL_ID, {
    name: 'Workout Nudges',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

/**
 * Register the alarm notification category with Snooze and Dismiss actions.
 */
export async function registerAlarmCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
    {
      identifier: 'SNOOZE',
      buttonTitle: 'Snooze',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'DISMISS',
      buttonTitle: 'Dismiss',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}
