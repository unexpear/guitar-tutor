import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTuner as useTunerEngine } from 'react-native-tuner-engine';
import { TUNING_PRESETS, TuningPreset, noteToFrequency } from '../data/tunings';
import {
  centsBetween,
  median,
  pushWindow,
  nearestStringIndex,
  verdictForCents,
  TuneVerdict,
} from '../pitch';

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
  verdict: null,
};

/**
 * Real-time guitar tuner backed by react-native-tuner-engine.
 * Pitch detection runs natively (YIN/PYIN/cepstrum ensemble on a C++ audio
 * thread); this hook maps the pitch stream onto the selected tuning's strings.
 */
export function useTuner(
  tuning: TuningPreset = TUNING_PRESETS[0],
  /**
   * Aim at one string instead of guessing. Without this the tuner snaps to
   * whichever string is nearest, so a badly flat string reads as the string
   * below it and the needle jumps between the two.
   */
  targetStringIndex: number | null = null
) {
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

  // Rolling window of recent frequencies. The raw stream is jittery enough
  // that the needle twitches on a perfectly steady note, so the reading is
  // taken from the median of the last few frames rather than the last one.
  const windowRef = useRef<number[]>([]);
  const [smoothHz, setSmoothHz] = useState(0);

  // Depend on the number, never on `latest` itself. The engine hands back a
  // fresh object every render, so an object dependency here re-ran the
  // effect on its own state update and span into "Maximum update depth
  // exceeded" the moment a pitch arrived.
  const rawHz = latest?.hasPitch ? latest.frequency : 0;

  useEffect(() => {
    if (!isRunning || rawHz <= 0) {
      windowRef.current = [];
      setSmoothHz(0);
      return;
    }
    windowRef.current = pushWindow(windowRef.current, rawHz);
    setSmoothHz(median(windowRef.current));
  }, [rawHz, isRunning]);

  // A new target means the old readings describe a different string.
  // Keyed on the tuning's name rather than the object, for the same reason.
  const tuningName = tuning.name;
  useEffect(() => {
    windowRef.current = [];
    setSmoothHz(0);
  }, [targetStringIndex, tuningName]);

  const state: TunerState = useMemo(() => {
    if (!isRunning) return IDLE_STATE;
    if (!latest || !latest.hasPitch || smoothHz <= 0) {
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
      note: latest.noteName,
      octave: latest.octave,
      cents: Math.round(latest.cents),
      frequency: smoothHz,
      confidence: latest.confidence,
      isActive: true,
      stringIndex: idx,
      nearestTarget: idx !== null ? tuning.strings[idx] : null,
      targetCents: signed === null ? null : Math.round(signed),
      verdict: signed === null ? null : verdictForCents(signed),
    };
  }, [latest, isRunning, smoothHz, stringFrequencies, tuning, targetStringIndex]);

  return {
    ...state,
    // Surfaced, not just logged: a denied mic permission used to leave the
    // tune button looking alive and doing nothing at all.
    error,
    startListening: start,
    stopListening: stop,
    toggleListening,
  };
}
