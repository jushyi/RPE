/**
 * Converts plan weekday numbers to expo-notifications weekday numbers.
 *
 * Plan uses: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
 * Expo uses: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
 *
 * Formula: ((weekday + 1) % 7) + 1
 */

export function planWeekdayToExpo(weekday: number): number {
  return ((weekday + 1) % 7) + 1;
}
