/**
 * Nudge message pool for missed workout notifications.
 * No emojis per project convention.
 */

const NUDGE_POOL: string[] = [
  'Skipping {dayName}? Your muscles disagree.',
  '{dayName} workout is still waiting for you.',
  'Your gym buddy is wondering where you are on {dayName}.',
  "Rest days are earned, not taken. {dayName} isn't a rest day.",
  "You planned {dayName} for a reason. Don't let past-you down.",
  'The hardest part is showing up. {dayName} is calling.',
  '{dayName} gains are slipping away with every passing minute.',
];

export function getRandomNudgeMessage(dayName: string): string {
  const index = Math.floor(Math.random() * NUDGE_POOL.length);
  return NUDGE_POOL[index].replace(/{dayName}/g, dayName);
}

/** Exported for testing */
export const NUDGE_MESSAGE_COUNT = NUDGE_POOL.length;
