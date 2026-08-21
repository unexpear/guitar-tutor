import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTuner as useTunerEngine } from 'react-native-tuner-engine';
import { TUNING_PRESETS, TuningPreset, noteToFrequency } from '../data/tunings';

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
}

/** Max distance (in cents) from a string's target pitch to still highlight it. */
const STRING_MATCH_CENTS = 250;

const IDLE_STATE: TunerState = {
  note: '--',
  octave: 0,
  cents: 0,
  frequency: 0,
  confidence: 0,
  isActive: false,
  stringIndex: null,
  nearestTarget: null,
  targetCents: null,
};

/**
 * Real-time guitar tuner backed by react-native-tuner-engine.
 * Pitch detection runs natively (YIN/PYIN/cepstrum ensemble on a C++ audio
 * thread); this hook maps the pitch stream onto the selected tuning's strings.
 */
export function useTuner(tuning: TuningPreset = TUNING_PRESETS[0]) {
  const engine = useTunerEngine({
    instrument: 'guitar',
    a4: 440,
    minFrequency: 60,
    maxFrequency: 1400,
    confidenceThreshold: 0.75,
    noiseGateDb: -55,
    onsetDetection: true,
  });
  const { start, stop, latest, isRunning, error } = engine;

  useEffect(() => {
    if (error) console.warn('Tuner engine error:', error.message);
  }, [error]);

  // Precompute target frequencies for the current tuning.
  const stringFrequencies = useMemo(
    () => tuning.strings.map((n) => noteToFrequency(n)),
    [tuning],
  );

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const toggleListening = useCallback(() => {
    if (isRunningRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const state: TunerState = useMemo(() => {
    if (!isRunning) return IDLE_STATE;
    if (!latest || !latest.hasPitch) {
      return { ...IDLE_STATE, isActive: true };
    }

    // Find the tuning string closest to the detected pitch (in cents).
    let nearestIdx: number | null = null;
    let nearestSignedCents = 0;
    let nearestAbsCents = Infinity;
    for (let i = 0; i < stringFrequencies.length; i++) {
      const target = stringFrequencies[i];
      if (target <= 0) continue;
      const signed = 1200 * Math.log2(latest.frequency / target);
      if (Math.abs(signed) < nearestAbsCents) {
        nearestAbsCents = Math.abs(signed);
        nearestSignedCents = signed;
        nearestIdx = i;
      }
    }
    const withinRange = nearestIdx !== null && nearestAbsCents <= STRING_MATCH_CENTS;

    return {
      note: latest.noteName,
      octave: latest.octave,
      cents: Math.round(latest.cents),
      frequency: latest.frequency,
      confidence: latest.confidence,
      isActive: true,
      stringIndex: withinRange ? nearestIdx : null,
      nearestTarget: withinRange && nearestIdx !== null ? tuning.strings[nearestIdx] : null,
      targetCents: withinRange ? Math.round(nearestSignedCents) : null,
    };
  }, [latest, isRunning, stringFrequencies, tuning]);

  return {
    ...state,
    startListening: start,
    stopListening: stop,
    toggleListening,
  };
}
