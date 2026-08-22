/**
 * Practice-streak arithmetic.
 *
 * Kept separate from the store so the day-boundary rules can be tested
 * without faking AsyncStorage. Everything here works in the player's local
 * time: a streak is about their days, not UTC's.
 */

/** Local calendar day as YYYY-MM-DD. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD key back to local midnight. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from `a` to `b`; negative if b is earlier. */
export function daysBetween(a: string, b: string): number {
  const ms = fromDateKey(b).getTime() - fromDateKey(a).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * The streak after practising on `today`.
 *
 * Same day: unchanged. The next day: one longer. Any bigger gap starts
 * over at one. A date before the last one recorded (clock changed, or the
 * device travelled) leaves the streak alone rather than corrupting it.
 */
export function nextStreak(
  lastDate: string | null,
  currentStreak: number,
  today: string
): number {
  if (!lastDate) return 1;
  const gap = daysBetween(lastDate, today);
  if (gap === 0) return Math.max(1, currentStreak);
  if (gap === 1) return currentStreak + 1;
  if (gap < 0) return Math.max(1, currentStreak);
  return 1;
}

/**
 * A streak is only live if it was fed today or yesterday. Read this before
 * showing a number: a stored streak of 9 from last month is not a streak.
 */
export function streakAsOf(
  lastDate: string | null,
  currentStreak: number,
  today: string
): number {
  if (!lastDate || currentStreak <= 0) return 0;
  const gap = daysBetween(lastDate, today);
  return gap === 0 || gap === 1 ? currentStreak : 0;
}

/** Minutes, rounded for display, from a seconds total. */
export function minutesFrom(seconds: number): number {
  return Math.floor(seconds / 60);
}

/** Drop log entries older than `keep` days so the store cannot grow forever. */
export function pruneLog(
  log: Record<string, number>,
  today: string,
  keep = 400
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(log)) {
    const age = daysBetween(key, today);
    if (age >= 0 && age <= keep) out[key] = value;
    // Future-dated entries (clock skew) are kept: they will age in.
    else if (age < 0) out[key] = value;
  }
  return out;
}
