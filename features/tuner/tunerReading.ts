import { noteToFrequency, TuningPreset } from './data/tunings';
import { instrumentProfile } from './data/instrumentProfiles';
import {
  centsBetween,
  correctSelectedStringHarmonic,
  equalTemperamentReading,
  nearestStringIndex,
  verdictForCents,
  TuneVerdict,
} from './pitch';

export type TunerSignal =
  | 'idle'
  | 'quiet'
  | 'noisy'
  | 'unstable'
  | 'clear';

export interface TunerState {
  note: string;
  octave: number;
  /** Deviation from the nearest chromatic note, -50..+50. */
  cents: number;
  frequency: number;
  confidence: number;
  rmsDb: number;
  isActive: boolean;
  stringIndex: number | null;
  nearestTarget: string | null;
  /** Deviation from the matched string's target pitch, or null when no string matched. */
  targetCents: number | null;
  /** In tune, close, or off — against the string being aimed at. */
  verdict: TuneVerdict | null;
  signal: TunerSignal;
  /** Raw detector value before a selected-string harmonic correction. */
  rawFrequency: number;
  /** 2–6 for an overtone, 0.5 or 1/3 for a period error, otherwise 1. */
  harmonicRatio: number;
}

export const IDLE_STATE: TunerState = {
  note: '--',
  octave: 0,
  cents: 0,
  frequency: 0,
  confidence: 0,
  rmsDb: -120,
  isActive: false,
  stringIndex: null,
  nearestTarget: null,
  targetCents: null,
  verdict: null,
  signal: 'idle',
  rawFrequency: 0,
  harmonicRatio: 1,
};

/**
 * The configuration handed to react-native-tuner-engine.
 *
 * Kept as data instead of inline literals so the default tuner contract has
 * somewhere to live and a test to pin it. Instrument-specific calls use
 * `tunerEngineOptionsFor`; this export remains the acoustic-guitar default.
 */
export const TUNER_ENGINE_OPTIONS = instrumentProfile(
  'guitar-acoustic',
).engine;

export function tunerEngineOptionsFor(
  tuning: TuningPreset,
  referencePitchHz = 440,
  sensitivity: 'quiet' | 'normal' | 'noisy' = 'normal',
) {
  const input = {
    quiet: { noiseGateDb: -60, confidenceThreshold: 0.68 },
    normal: { noiseGateDb: -55, confidenceThreshold: 0.75 },
    noisy: { noiseGateDb: -48, confidenceThreshold: 0.82 },
  }[sensitivity];
  return {
    ...instrumentProfile(tuning.instrumentId).engine,
    ...input,
    // The native processor already applies median-5. A moderate EMA and
    // three-frame note hysteresis reduce display chatter without masking a
    // fresh pluck (onset detection resets the processor on attacks).
    emaAlpha: 0.32,
    hysteresisFrames: 3,
    a4: referencePitchHz,
  };
}

/** The target pitch of each string of a tuning, low to high. */
export function targetFrequenciesFor(
  tuning: TuningPreset,
  referencePitchHz = 440,
): number[] {
  return tuning.strings.map((n) => noteToFrequency(n, referencePitchHz));
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
    rmsDb?: number;
  } | null,
  opts: {
    isRunning: boolean;
    /** Median of the recent readings; 0 when nothing has been heard yet. */
    smoothHz: number;
    targetStringIndex: number | null;
    preferredStringIndex?: number | null;
    referencePitchHz?: number;
    tuning: TuningPreset;
    stringFrequencies: number[];
    /** Movement across the current JS window, measured peak-to-peak. */
    spreadCents?: number;
    /** User-selected green/in-tune window, in cents. */
    inTuneCents?: number;
    /** User-selected outer edge of the yellow/close zone, in cents. */
    closeCents?: number;
    /** Must match the active native-engine room profile. */
    minimumConfidence?: number;
  }
): TunerState {
  const {
    isRunning,
    smoothHz,
    targetStringIndex,
    tuning,
    stringFrequencies,
    spreadCents = 0,
    inTuneCents = 1,
    closeCents = 10,
    minimumConfidence = 0.75,
    preferredStringIndex = null,
    referencePitchHz = 440,
  } = opts;

  if (!isRunning) return IDLE_STATE;

  if (!reading || !reading.hasPitch || smoothHz <= 0 || !Number.isFinite(smoothHz)) {
    const rmsDb = reading?.rmsDb ?? -120;
    const signal: TunerSignal =
      rmsDb >= -42 ? 'noisy' : rmsDb <= -62 ? 'quiet' : 'unstable';
    return { ...IDLE_STATE, isActive: true, rmsDb, signal };
  }

  if (reading.confidence < minimumConfidence || spreadCents > 24) {
    return {
      ...IDLE_STATE,
      isActive: true,
      confidence: reading.confidence,
      rmsDb: reading.rmsDb ?? -120,
      rawFrequency: smoothHz,
      signal: 'unstable',
    };
  }

  // Chromatic mode follows the detector's nearest semitone without forcing
  // the reading toward an instrument string.
  if (tuning.strings.length === 0) {
    const chromatic = equalTemperamentReading(smoothHz, referencePitchHz);
    return {
      note: chromatic.noteName,
      octave: chromatic.octave,
      cents: chromatic.cents,
      frequency: smoothHz,
      confidence: reading.confidence,
      rmsDb: reading.rmsDb ?? -120,
      isActive: true,
      stringIndex: null,
      nearestTarget:
        chromatic.noteName === '--' ? null : `${chromatic.noteName}${chromatic.octave}`,
      targetCents: chromatic.cents,
      verdict: verdictForCents(chromatic.cents, inTuneCents, closeCents),
      signal: 'clear',
      rawFrequency: smoothHz,
      harmonicRatio: 1,
    };
  }

  const idx =
    targetStringIndex !== null
      ? targetStringIndex
      : nearestStringIndex(smoothHz, stringFrequencies, preferredStringIndex);

  const target = idx !== null ? stringFrequencies[idx] : 0;
  // An octave "correction" is unsafe when that pitch is already another open
  // string: banjo's short G is the octave of the low G, and ukulele high G is
  // not a harmonic of C.
  const rawIsAnotherString =
    targetStringIndex !== null &&
    stringFrequencies.some(
      (other, index) =>
        index !== targetStringIndex &&
        other > 0 &&
        Math.abs(centsBetween(smoothHz, other)) <= 45,
    );
  const corrected =
    target > 0 && targetStringIndex !== null && !rawIsAnotherString
      ? correctSelectedStringHarmonic(smoothHz, target)
      : { frequency: smoothHz, ratio: 1 };
  const signed =
    target > 0 ? centsBetween(corrected.frequency, target) : null;
  const displayed = equalTemperamentReading(corrected.frequency, referencePitchHz);

  return {
    note: displayed.noteName,
    octave: displayed.octave,
    cents: displayed.cents,
    frequency: corrected.frequency,
    confidence: reading.confidence,
    rmsDb: reading.rmsDb ?? -120,
    isActive: true,
    stringIndex: idx,
    nearestTarget: idx !== null ? tuning.strings[idx] : null,
    targetCents: signed === null ? null : Math.round(signed * 10) / 10,
    verdict:
      signed === null ? null : verdictForCents(signed, inTuneCents, closeCents),
    signal: 'clear',
    rawFrequency: smoothHz,
    harmonicRatio: corrected.ratio,
  };
}
