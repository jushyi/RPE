/**
 * Formats a date as a human-readable relative timestamp.
 * - <1min: "just now"
 * - <60min: "Xm ago"
 * - <24h: "Xh ago"
 * - <7d: "Xd ago"
 * - >=7d: locale date string
 */
export function relativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(date).toLocaleDateString();
}
