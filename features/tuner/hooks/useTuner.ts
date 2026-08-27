import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTuner as useTunerEngine } from 'react-native-tuner-engine';
import { TUNING_PRESETS, TuningPreset } from '../data/tunings';
import { median, pushWindow } from '../pitch';
import {
  mapTunerReading,
  targetFrequenciesFor,
  TUNER_ENGINE_OPTIONS,
  TunerState,
} from '../tunerReading';

export type { TunerState };

/**
 * Real-time guitar tuner backed by react-native-tuner-engine.
 * Pitch detection runs natively (YIN/PYIN/cepstrum ensemble on a C++ audio
 * thread) with the configuration in TUNER_ENGINE_OPTIONS; the JS side maps
 * the pitch stream onto the selected tuning's strings. All of that mapping
 * lives in the pure mapTunerReading so the tuner contract is testable.
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
  const engine = useTunerEngine(TUNER_ENGINE_OPTIONS);
  const { start, stop, latest, isRunning, error } = engine;

  useEffect(() => {
    if (error) console.warn('Tuner engine error:', error.message);
  }, [error]);

  // Precompute target frequencies for the current tuning.
  const stringFrequencies = useMemo(
    () => targetFrequenciesFor(tuning),
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
    if (!isRunning || rawHz <= 0 || !Number.isFinite(rawHz)) {
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

  const state: TunerState = useMemo(
    () =>
      mapTunerReading(latest, {
        isRunning,
        smoothHz,
        targetStringIndex,
        tuning,
        stringFrequencies,
      }),
    [latest, isRunning, smoothHz, stringFrequencies, tuning, targetStringIndex],
  );

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