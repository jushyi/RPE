/**
 * Mock for expo-notifications used in alarm tests.
 */

export const scheduleNotificationAsync = jest.fn().mockResolvedValue('mock-notification-id');
export const cancelScheduledNotificationAsync = jest.fn().mockResolvedValue(undefined);
export const setNotificationCategoryAsync = jest.fn().mockResolvedValue(undefined);
export const setNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
export const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const getPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const addNotificationResponseReceivedListener = jest.fn().mockReturnValue({ remove: jest.fn() });
export const AndroidImportance = {
  MAX: 5,
  HIGH: 4,
  DEFAULT: 3,
  LOW: 2,
  MIN: 1,
};
export const AndroidNotificationPriority = {
  MAX: 'max',
  HIGH: 'high',
  DEFAULT: 'default',
  LOW: 'low',
  MIN: 'min',
};
export const SchedulableTriggerInputTypes = {
  WEEKLY: 'weekly',
  DAILY: 'daily',
  TIME_INTERVAL: 'timeInterval',
  DATE: 'date',
  CALENDAR: 'calendar',
};
