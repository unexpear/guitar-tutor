import { toDateKey, daysBetween } from './streak';

/**
 * What the app knows about how well you play a given chord.
 *
 * Only counts attempts where something was actually judged — a quiz answer,
 * a drill target hit or missed, a change that landed. Merely looking at a
 * diagram is not practice and does not count, or every chord you browsed
 * would look mastered.
 */
export interface ChordStat {
  /** Judged attempts. */
  attempts: number;
  /** Attempts that came out right. */
  correct: number;
  /** Local day of the most recent attempt, YYYY-MM-DD. */
  lastAt: string;
}

export type ChordStats = Record<string, ChordStat>;

/** Attempts needed before an accuracy figure means anything. */
export const MIN_ATTEMPTS_FOR_VERDICT = 4;

export function recordAttempt(
  stats: ChordStats,
  chordName: string,
  correct: boolean,
  now: Date = new Date()
): ChordStats {
  const prev = stats[chordName];
  return {
    ...stats,
    [chordName]: {
      attempts: (prev?.attempts ?? 0) + 1,
      correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
      lastAt: toDateKey(now),
    },
  };
}

/** 0-100, or null when there is not enough evidence to say. */
export function accuracy(stat: ChordStat | undefined): number | null {
  if (!stat || stat.attempts === 0) return null;
  return Math.round((stat.correct / stat.attempts) * 100);
}

export type ChordVerdict = 'untried' | 'learning' | 'shaky' | 'solid';

/**
 * A plain-language read on a chord. "learning" means it has been tried but
 * not enough times to judge, which is different from being bad at it.
 */
export function verdictFor(stat: ChordStat | undefined): ChordVerdict {
  if (!stat || stat.attempts === 0) return 'untried';
  if (stat.attempts < MIN_ATTEMPTS_FOR_VERDICT) return 'learning';
  return (accuracy(stat) ?? 0) >= 75 ? 'solid' : 'shaky';
}

/**
 * Practice priority: higher means it deserves attention sooner.
 *
 * Weakness dominates, because a chord you keep missing is the one holding
 * you back. Staleness is a lighter nudge on top, so a solid chord you have
 * not touched in weeks eventually resurfaces without ever outranking a
 * chord you are actively failing. Untried chords sit in the middle: worth
 * getting to, but not ahead of something already going wrong.
 */
export function practicePriority(
  stat: ChordStat | undefined,
  today: string
): number {
  if (!stat || stat.attempts === 0) return 50;
  const acc = accuracy(stat) ?? 0;
  const weakness = 100 - acc;
  const stale = Math.min(30, Math.max(0, daysBetween(stat.lastAt, today)));
  return weakness + stale * 0.5;
}

/**
 * The chords worth practising next, worst first. Ties break on name so the
 * list does not shuffle between renders.
 */
export function rankForPractice(
  names: string[],
  stats: ChordStats,
  now: Date = new Date()
): string[] {
  const today = toDateKey(now);
  return [...names].sort((a, b) => {
    const diff = practicePriority(stats[b], today) - practicePriority(stats[a], today);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}
