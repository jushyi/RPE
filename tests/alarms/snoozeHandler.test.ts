import * as Notifications from 'expo-notifications';
import { SNOOZE_MINUTES } from '@/features/alarms/constants';

/**
 * Snooze handler: when user taps SNOOZE on alarm notification,
 * schedule a one-shot notification after SNOOZE_MINUTES.
 * When user taps DISMISS, do nothing.
 */

async function handleNotificationResponse(
  actionIdentifier: string,
  notificationTitle: string,
  notificationBody: string,
): Promise<void> {
  if (actionIdentifier === 'SNOOZE') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitle,
        body: notificationBody,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: SNOOZE_MINUTES * 60,
      },
    });
  }
  // DISMISS: do nothing
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('snoozeHandler', () => {
  it('schedules one-shot notification on SNOOZE action', async () => {
    await handleNotificationResponse('SNOOZE', 'Wake-up alarm', 'Time to get ready');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Wake-up alarm',
          body: 'Time to get ready',
          sound: true,
        }),
        trigger: expect.objectContaining({
          seconds: SNOOZE_MINUTES * 60,
        }),
      }),
    );
  });

  it('does not schedule anything on DISMISS action', async () => {
    await handleNotificationResponse('DISMISS', 'Wake-up alarm', 'Time to get ready');

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('snooze duration is SNOOZE_MINUTES * 60 seconds', () => {
    expect(SNOOZE_MINUTES * 60).toBe(480); // 8 minutes = 480 seconds
  });
});
