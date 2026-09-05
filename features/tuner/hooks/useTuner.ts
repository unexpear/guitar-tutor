import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTuner as useTunerEngine } from 'react-native-tuner-engine';
import { TUNING_PRESETS, TuningPreset } from '../data/tunings';
import { frequencySpreadCents, median, pushWindow } from '../pitch';
import { useSettingsStore } from '../../store/settingsStore';
import {
  mapTunerReading,
  targetFrequenciesFor,
  tunerEngineOptionsFor,
  TunerState,
} from '../tunerReading';

export type { TunerState };

/**
 * Real-time guitar tuner backed by react-native-tuner-engine.
 * Pitch detection runs natively (YIN/PYIN/cepstrum ensemble on a C++ audio
 * thread) with the selected instrument profile; the JS side maps the pitch
 * stream onto the selected tuning's strings. All of that mapping lives in
 * the pure mapTunerReading so the tuner contract is testable.
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
  const referencePitchHz = useSettingsStore((state) => state.referencePitchHz);
  const inTuneCents = useSettingsStore(
    (state) => state.inTuneToleranceCents,
  );
  const closeCents = useSettingsStore((state) => state.closeToleranceCents);
  const tunerSensitivity = useSettingsStore((state) => state.tunerSensitivity);
  const engineOptions = useMemo(
    () => tunerEngineOptionsFor(tuning, referencePitchHz, tunerSensitivity),
    [referencePitchHz, tunerSensitivity, tuning.instrumentId],
  );
  const engine = useTunerEngine(engineOptions);
  const { start, stop, latest, isRunning, error } = engine;

  useEffect(() => {
    if (error) console.warn('Tuner engine error:', error.message);
  }, [error]);

  // Precompute target frequencies for the current tuning.
  const stringFrequencies = useMemo(
    () => targetFrequenciesFor(tuning, referencePitchHz),
    [referencePitchHz, tuning],
  );

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Permission and engine startup are asynchronous. Keep a synchronous guard
  // as well as UI state so two quick taps cannot start the singleton engine
  // twice before its isRunning update reaches React.
  const startPendingRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);

  const startListening = useCallback(async () => {
    if (isRunningRef.current || startPendingRef.current) return;
    startPendingRef.current = true;
    setIsStarting(true);
    try {
      await start();
    } finally {
      startPendingRef.current = false;
      setIsStarting(false);
    }
  }, [start]);

  const toggleListening = useCallback(() => {
    if (isRunningRef.current) {
      void stop();
    } else {
      void startListening();
    }
  }, [startListening, stop]);

  // Rolling window of recent frequencies. The raw stream is jittery enough
  // that the needle twitches on a perfectly steady note, so the reading is
  // taken from the median of the last few frames rather than the last one.
  const windowRef = useRef<number[]>([]);
  const [smoothHz, setSmoothHz] = useState(0);
  const [spreadCents, setSpreadCents] = useState(0);
  const [heldReading, setHeldReading] = useState<typeof latest>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Depend on the number, never on `latest` itself. The engine hands back a
  // fresh object every render, so an object dependency here re-ran the
  // effect on its own state update and span into "Maximum update depth
  // exceeded" the moment a pitch arrived.
  const rawHz = latest?.hasPitch ? latest.frequency : 0;

  const rawConfidence = latest?.confidence ?? 0;
  const rawHasPitch = latest?.hasPitch ?? false;
  const rawRmsDb = latest?.rmsDb ?? -120;

  useEffect(() => {
    if (!isRunning) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
      windowRef.current = [];
      setSmoothHz(0);
      setSpreadCents(0);
      setHeldReading(null);
      return;
    }
    if (!rawHasPitch || rawHz <= 0 || !Number.isFinite(rawHz)) {
      // Real microphones often drop one or two frames during a decaying
      // sustain. Keep the last trustworthy pitch briefly instead of flashing
      // the tuner blank; prolonged silence/noise still clears it promptly.
      if (!clearTimerRef.current) {
        clearTimerRef.current = setTimeout(() => {
          windowRef.current = [];
          setSmoothHz(0);
          setSpreadCents(0);
          setHeldReading(null);
          clearTimerRef.current = null;
        }, 450);
      }
      return;
    }
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = null;
    windowRef.current = pushWindow(windowRef.current, rawHz);
    setSmoothHz(median(windowRef.current));
    setSpreadCents(frequencySpreadCents(windowRef.current));
    setHeldReading(latest);
    return () => {
      // Do not clear here: this cleanup runs for each new audio frame.
    };
  }, [rawConfidence, rawHasPitch, rawHz, rawRmsDb, isRunning]);

  useEffect(() => () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
  }, []);

  // A new target means the old readings describe a different string.
  // Keyed on the stable id rather than the object, for the same reason.
  const tuningId = tuning.id;
  useEffect(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = null;
    windowRef.current = [];
    setSmoothHz(0);
    setSpreadCents(0);
    setHeldReading(null);
  }, [targetStringIndex, tuningId, tuning.instrumentId]);

  const state: TunerState = useMemo(
    () =>
      mapTunerReading(heldReading ?? latest, {
        isRunning,
        smoothHz,
        spreadCents,
        inTuneCents,
        closeCents,
        minimumConfidence: engineOptions.confidenceThreshold,
        targetStringIndex,
        tuning,
        stringFrequencies,
      }),
    [
      inTuneCents,
      closeCents,
      isRunning,
      heldReading,
      latest,
      engineOptions.confidenceThreshold,
      smoothHz,
      spreadCents,
      stringFrequencies,
      targetStringIndex,
      tuning,
    ],
  );

  return {
    ...state,
    referencePitchHz,
    inTuneCents,
    isStarting,
    // Surfaced, not just logged: a denied mic permission used to leave the
    // tune button looking alive and doing nothing at all.
    error,
    startListening,
    stopListening: stop,
    toggleListening,
  };
}
