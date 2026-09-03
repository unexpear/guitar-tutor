/**
 * Pitch maths and reading-stability helpers for the tuner.
 *
 * Kept pure so the thresholds that decide "in tune" can be tested, rather
 * than being three magic numbers buried in a component.
 */

/** How many recent readings the median is taken over. */
// Native output has already passed a median-5 and EMA. Three JS samples are
// enough to reject a bridge outlier without stacking another long delay.
export const SMOOTH_WINDOW = 3;

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

/** Peak-to-peak movement in cents. Frequency ratios make this octave-safe. */
export function frequencySpreadCents(values: number[]): number {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  if (valid.length < 2) return 0;
  return Math.abs(centsBetween(Math.max(...valid), Math.min(...valid)));
}

export interface HarmonicCorrection {
  frequency: number;
  /** 1 is uncorrected; 2–4 are overtones; 0.5 is period doubling. */
  ratio: number;
}

/**
 * Correct a common octave/harmonic error only when the player explicitly
 * selected a target string. In automatic mode the same pitch may genuinely
 * belong to another open string, so applying this globally would invent
 * false positives.
 */
export function correctSelectedStringHarmonic(
  frequency: number,
  target: number,
  toleranceCents = 45,
): HarmonicCorrection {
  if (frequency <= 0 || target <= 0) return { frequency, ratio: 1 };
  const ratios = [1, 2, 3, 4, 0.5] as const;
  let best = { frequency, ratio: 1 };
  let bestError = Math.abs(centsBetween(frequency, target));

  for (const ratio of ratios.slice(1)) {
    const corrected = frequency / ratio;
    const error = Math.abs(centsBetween(corrected, target));
    if (error < bestError && error <= toleranceCents) {
      best = { frequency: corrected, ratio };
      bestError = error;
    }
  }
  return best;
}

export type TuneVerdict = 'in-tune' | 'close' | 'off';

/**
 * How the tuner reports a reading.
 *
 * Measured to tenth-cent precision, matching the most precise readout the app
 * exposes. This is a threshold, not a hardware-accuracy claim.
 *
 *   0 - chosen tolerance  in tune
 *   up to 9                close
 *   10+      off, in either direction
 */
export const OFF_CENTS = 10;
export const DEFAULT_IN_TUNE_CENTS = 1;

export function verdictForCents(
  cents: number,
  inTuneCents = DEFAULT_IN_TUNE_CENTS,
): TuneVerdict {
  const deviation = Number.isFinite(cents) ? Math.abs(cents) : Number.POSITIVE_INFINITY;
  const requestedTolerance = Number.isFinite(inTuneCents)
    ? inTuneCents
    : DEFAULT_IN_TUNE_CENTS;
  const tolerance = Math.max(0.5, Math.min(5, requestedTolerance));
  if (deviation <= tolerance) return 'in-tune';
  return deviation >= OFF_CENTS ? 'off' : 'close';
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
