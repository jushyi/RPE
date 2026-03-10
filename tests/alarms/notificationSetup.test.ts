import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  requestNotificationPermission,
  setupAlarmChannel,
  registerAlarmCategory,
} from '@/features/alarms/utils/notificationSetup';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requestNotificationPermission', () => {
  it('requests permissions and returns true when granted', async () => {
    const result = await requestNotificationPermission();

    expect(result).toBe(true);
  });

  it('returns false when not on a physical device', async () => {
    // Override isDevice for this test
    const originalIsDevice = Device.isDevice;
    Object.defineProperty(Device, 'isDevice', { value: false, writable: true });

    const result = await requestNotificationPermission();
    expect(result).toBe(false);

    Object.defineProperty(Device, 'isDevice', { value: originalIsDevice, writable: true });
  });
});

describe('setupAlarmChannel', () => {
  it('creates channels on Android', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', writable: true });

    await setupAlarmChannel();

    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'alarm-channel-v1',
      expect.objectContaining({
        name: 'Workout Alarms',
        importance: Notifications.AndroidImportance.MAX,
      }),
    );
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'nudge-channel-v1',
      expect.objectContaining({
        name: 'Workout Nudges',
        importance: Notifications.AndroidImportance.HIGH,
      }),
    );

    Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
  });

  it('does nothing on iOS', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });

    await setupAlarmChannel();

    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();

    Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
  });
});

describe('registerAlarmCategory', () => {
  it('registers category with Snooze and Dismiss actions', async () => {
    await registerAlarmCategory();

    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
      'alarm',
      expect.arrayContaining([
        expect.objectContaining({
          identifier: 'SNOOZE',
          buttonTitle: 'Snooze',
        }),
        expect.objectContaining({
          identifier: 'DISMISS',
          buttonTitle: 'Dismiss',
        }),
      ]),
    );
  });
});
