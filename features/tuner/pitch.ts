/**
 * Pitch maths and reading-stability helpers for the tuner.
 *
 * Kept pure so the thresholds that decide "in tune" can be tested, rather
 * than being three magic numbers buried in a component.
 */

/** How many recent readings the median is taken over. */
export const SMOOTH_WINDOW = 5;

/**
 * Cents from `target` to `frequency`. Negative is flat, positive is sharp.
 * Non-finite or non-positive inputs resolve to 0, so a malformed native
 * frame can never read as a real deviation (or tip the verdict toward
 * "close").
 */
export function centsBetween(frequency: number, target: number): number {
  if (!Number.isFinite(frequency) || !Number.isFinite(target)) return 0;
  if (frequency <= 0 || target <= 0) return 0;
  return 1200 * Math.log2(frequency / target);
}

/**
 * Median of the recent readings.
 *
 * A median rather than an average on purpose: pitch detectors occasionally
 * emit a wild octave-jump sample, and one bad frame drags a mean far enough
 * to make the needle leap. A median ignores it entirely.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Append to a fixed-length rolling window, oldest out. */
export function pushWindow(window: number[], value: number, size = SMOOTH_WINDOW): number[] {
  const next = [...window, value];
  return next.length > size ? next.slice(next.length - size) : next;
}

export type TuneVerdict = 'in-tune' | 'close' | 'off';

/**
 * How the tuner reports a reading.
 *
 * Measured against the displayed (rounded) cents, so the colour always
 * agrees with the number on screen — a readout of 0 that glowed amber would
 * just look broken.
 *
 *   0        in tune
 *   1 - 9    close
 *   10+      off, in either direction
 */
export const OFF_CENTS = 10;

export function verdictForCents(cents: number): TuneVerdict {
  const rounded = Math.abs(Math.round(cents));
  if (rounded === 0) return 'in-tune';
  return rounded >= OFF_CENTS ? 'off' : 'close';
}

/**
 * Which string a pitch is nearest, for the auto-detect mode. Returns null
 * when nothing is close enough to be a plausible attempt at a string.
 */
export const STRING_MATCH_CENTS = 250;

export function nearestStringIndex(
  frequency: number,
  stringFrequencies: number[]
): number | null {
  let best: number | null = null;
  let bestAbs = Infinity;
  for (let i = 0; i < stringFrequencies.length; i++) {
    const target = stringFrequencies[i];
    if (target <= 0) continue;
    const abs = Math.abs(centsBetween(frequency, target));
    if (abs < bestAbs) {
      bestAbs = abs;
      best = i;
    }
  }
  return best !== null && bestAbs <= STRING_MATCH_CENTS ? best : null;
}
