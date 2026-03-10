import { getRandomNudgeMessage, NUDGE_MESSAGE_COUNT } from '@/features/alarms/utils/nudgeMessages';

describe('nudgeMessages', () => {
  it('returns a string', () => {
    const message = getRandomNudgeMessage('Chest');
    expect(typeof message).toBe('string');
  });

  it('contains the day name in the message', () => {
    const message = getRandomNudgeMessage('Chest');
    expect(message).toContain('Chest');
  });

  it('has at least 5 message variations', () => {
    expect(NUDGE_MESSAGE_COUNT).toBeGreaterThanOrEqual(5);
  });

  it('replaces all occurrences of dayName placeholder', () => {
    // Run multiple times to increase chance of hitting a message with multiple placeholders
    for (let i = 0; i < 20; i++) {
      const message = getRandomNudgeMessage('Legs');
      expect(message).not.toContain('{dayName}');
    }
  });
});
