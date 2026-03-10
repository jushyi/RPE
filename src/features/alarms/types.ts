/**
 * Alarm type definitions for workout alarm scheduling.
 */

export interface AlarmConfig {
  planDayId: string;
  weekday: number;
  hour: number;
  minute: number;
  dayName: string;
}

export interface AlarmState {
  isPaused: boolean;
}
