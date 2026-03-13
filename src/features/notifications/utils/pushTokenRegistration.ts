/**
 * Push token registration utility.
 * Registers the device's Expo push token with Supabase for push notification delivery.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase/client';

/**
 * Register the device's push token with Supabase.
 * Returns the token string on success, or null if:
 * - Not running on a physical device (emulator/simulator)
 * - Notification permissions not granted
 * - Any error during registration
 *
 * This function is non-blocking -- failures are logged but do not throw.
 */
export async function registerPushToken(userId: string): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;

    if (finalStatus !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      finalStatus = newStatus;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    await (supabase.from('push_tokens') as any).upsert(
      {
        user_id: userId,
        token: tokenData,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    return tokenData;
  } catch (error) {
    console.warn('Failed to register push token:', error);
    return null;
  }
}
