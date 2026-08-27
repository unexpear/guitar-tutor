import { noteToFrequency, TuningPreset } from './data/tunings';
import { centsBetween, nearestStringIndex, verdictForCents, TuneVerdict } from './pitch';

export interface TunerState {
  note: string;
  octave: number;
  /** Deviation from the nearest chromatic note, -50..+50. */
  cents: number;
  frequency: number;
  confidence: number;
  isActive: boolean;
  stringIndex: number | null;
  nearestTarget: string | null;
  /** Deviation from the matched string's target pitch, or null when no string matched. */
  targetCents: number | null;
  /** In tune, close, or off — against the string being aimed at. */
  verdict: TuneVerdict | null;
}

export const IDLE_STATE: TunerState = {
  note: '--',
  octave: 0,
  cents: 0,
  frequency: 0,
  confidence: 0,
  isActive: false,
  stringIndex: null,
  nearestTarget: null,
  targetCents: null,
  verdict: null,
};

/**
 * The configuration handed to react-native-tuner-engine.
 *
 * Kept as data instead of inline literals so the tuner contract has
 * somewhere to live and a test to pin it. `minFrequency: 60` is an
 * intentional regression lock: the engine handles sub-60 detection, but the
 * app deliberately stays guitar-focused (E2 and up) until bass is designed
 * for. Move the floor, and the tests that assert this configuration fail.
 */
export const TUNER_ENGINE_OPTIONS = {
  instrument: 'guitar',
  a4: 440,
  minFrequency: 60,
  maxFrequency: 1400,
  confidenceThreshold: 0.75,
  noiseGateDb: -55,
  onsetDetection: true,
} as const;

/** The target pitch of each string of a tuning, low to high. */
export function targetFrequenciesFor(tuning: TuningPreset): number[] {
  return tuning.strings.map((n) => noteToFrequency(n));
}

/**
 * Pure mapping from a native pitch reading to the TunerState the UI renders.
 *
 * The whole tuner contract — string aiming, cents deviation, in-tune verdict,
 * and the "listening but no pitch yet" state — lives here so it can be
 * exercised without a device or a React renderer.
 */
export function mapTunerReading(
  reading: {
    hasPitch: boolean;
    noteName: string;
    octave: number;
    cents: number;
    confidence: number;
  } | null,
  opts: {
    isRunning: boolean;
    /** Median of the recent readings; 0 when nothing has been heard yet. */
    smoothHz: number;
    targetStringIndex: number | null;
    tuning: TuningPreset;
    stringFrequencies: number[];
  }
): TunerState {
  const { isRunning, smoothHz, targetStringIndex, tuning, stringFrequencies } = opts;

  if (!isRunning) return IDLE_STATE;

  if (!reading || !reading.hasPitch || smoothHz <= 0 || !Number.isFinite(smoothHz)) {
    return { ...IDLE_STATE, isActive: true };
  }

  // Aimed at a string, or free to pick whichever is nearest.
  const idx =
    targetStringIndex !== null
      ? targetStringIndex
      : nearestStringIndex(smoothHz, stringFrequencies);

  const target = idx !== null ? stringFrequencies[idx] : 0;
  const signed = target > 0 ? centsBetween(smoothHz, target) : null;

  return {
    note: reading.noteName,
    octave: reading.octave,
    cents: Number.isFinite(reading.cents) ? Math.round(reading.cents) : 0,
    frequency: smoothHz,
    confidence: reading.confidence,
    isActive: true,
    stringIndex: idx,
    nearestTarget: idx !== null ? tuning.strings[idx] : null,
    targetCents: signed === null ? null : Math.round(signed),
    verdict: signed === null ? null : verdictForCents(signed),
  };
}