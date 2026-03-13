import {
  REACTION_ICONS,
  getReactionIcon,
} from '@/features/social/utils/reactionIcons';

describe('REACTION_ICONS', () => {
  it('has exactly 5 entries', () => {
    expect(REACTION_ICONS).toHaveLength(5);
  });

  it('each entry has key, icon, and label properties', () => {
    for (const reaction of REACTION_ICONS) {
      expect(reaction).toHaveProperty('key');
      expect(reaction).toHaveProperty('icon');
      expect(reaction).toHaveProperty('label');
    }
  });

  it('contains fire entry with Ionicons icon name', () => {
    const fire = REACTION_ICONS.find((r) => r.key === 'fire');
    expect(fire).toBeDefined();
    expect(fire?.icon).toBe('flame-outline');
    expect(fire?.label).toBeTruthy();
  });

  it('contains muscle entry with Ionicons icon name', () => {
    const muscle = REACTION_ICONS.find((r) => r.key === 'muscle');
    expect(muscle).toBeDefined();
    expect(muscle?.icon).toBe('fitness-outline');
  });

  it('contains clap/thumbs-up entry', () => {
    const clap = REACTION_ICONS.find((r) => r.key === 'clap');
    expect(clap).toBeDefined();
    expect(clap?.icon).toBe('thumbs-up-outline');
  });

  it('contains trophy entry', () => {
    const trophy = REACTION_ICONS.find((r) => r.key === 'trophy');
    expect(trophy).toBeDefined();
    expect(trophy?.icon).toBe('trophy-outline');
  });

  it('contains heart entry', () => {
    const heart = REACTION_ICONS.find((r) => r.key === 'heart');
    expect(heart).toBeDefined();
    expect(heart?.icon).toBe('heart-outline');
  });

  it('does not use emoji characters - only icon key strings', () => {
    // Per CLAUDE.md: No emojis in UI - use icon names only
    const emojiRegex = /\p{Emoji}/u;
    for (const reaction of REACTION_ICONS) {
      expect(emojiRegex.test(reaction.icon)).toBe(false);
      expect(emojiRegex.test(reaction.label)).toBe(false);
    }
  });
});

describe('getReactionIcon', () => {
  it('returns correct entry for "fire" key', () => {
    const result = getReactionIcon('fire');
    expect(result).toBeDefined();
    expect(result?.key).toBe('fire');
    expect(result?.icon).toBe('flame-outline');
  });

  it('returns correct entry for "heart" key', () => {
    const result = getReactionIcon('heart');
    expect(result).toBeDefined();
    expect(result?.key).toBe('heart');
  });

  it('returns undefined for unknown key', () => {
    const result = getReactionIcon('unknown_key');
    expect(result).toBeUndefined();
  });

  it('returns the correct entry for all defined keys', () => {
    for (const reaction of REACTION_ICONS) {
      const found = getReactionIcon(reaction.key);
      expect(found).toEqual(reaction);
    }
  });
});
