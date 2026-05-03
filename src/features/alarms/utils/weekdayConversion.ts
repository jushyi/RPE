/**
 * Converts plan weekday numbers to expo-notifications weekday numbers.
 *
 * Plan uses: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 *   (matches JavaScript Date.getDay() and the UI's WEEKDAY_LABELS)
 * Expo uses: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun (ISO)
 *   Note: expo-notifications v55 docs claim 1=Sun, but its WEEKLY trigger
 *   fires one day later than that mapping at runtime. ISO matches the
 *   observed firing day.
 *
 * Formula: ((weekday + 6) % 7) + 1
 */

export function planWeekdayToExpo(weekday: number): number {
  return ((weekday + 6) % 7) + 1;
}
