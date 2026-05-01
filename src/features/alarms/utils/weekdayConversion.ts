/**
 * Converts plan weekday numbers to expo-notifications weekday numbers.
 *
 * Plan uses: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 *   (matches JavaScript Date.getDay() and the UI's WEEKDAY_LABELS)
 * Expo uses: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
 *
 * Formula: weekday + 1
 */

export function planWeekdayToExpo(weekday: number): number {
  return weekday + 1;
}
