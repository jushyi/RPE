/**
 * Reaction icon definitions for the social feed.
 * Uses Ionicons icon names (NOT emoji characters) per CLAUDE.md project convention.
 * The `emoji` column in the reactions DB table stores the `key` string (e.g. "fire"),
 * which maps to an Ionicons icon name for rendering in the UI.
 */

export interface ReactionIconEntry {
  /** Key stored in the DB reactions table `emoji` column */
  key: string;
  /** Ionicons icon name for UI rendering */
  icon: string;
  /** Human-readable label */
  label: string;
}

/** All supported reaction icons. No emoji characters — Ionicons only. */
export const REACTION_ICONS: ReactionIconEntry[] = [
  { key: 'fire',   icon: 'flame-outline',    label: 'Fire'     },
  { key: 'muscle', icon: 'fitness-outline',  label: 'Strong'   },
  { key: 'clap',   icon: 'thumbs-up-outline', label: 'Nice'    },
  { key: 'trophy', icon: 'trophy-outline',   label: 'Champion' },
  { key: 'heart',  icon: 'heart-outline',    label: 'Love'     },
] as const;

/**
 * Look up a reaction icon entry by its key.
 * @returns The matching ReactionIconEntry, or undefined if not found.
 */
export function getReactionIcon(key: string): ReactionIconEntry | undefined {
  return REACTION_ICONS.find((r) => r.key === key);
}
