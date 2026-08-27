import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useProgressStore } from '../store/progressStore';
import { createPracticeClock, PracticeClock } from './practiceClock';

/** How often a long session is written down, so a crash loses little. */
const FLUSH_EVERY_MS = 30_000;

/**
 * Counts time spent actually doing something with the guitar and files it
 * against today.
 *
 * Pass whatever the screen already knows about being busy — the tuner
 * listening, the metronome running, a drill in progress.
 *
 * All of the accounting lives in createPracticeClock: time is measured
 * against the wall clock rather than counted in ticks, so a stalled JS
 * thread cannot inflate or lose it, and every session boundary (background,
 * unmount, screen losing focus) settles the open interval exactly once.
 * This hook only owns the wiring — the clock it uses is stable for the
 * screen's lifetime and is the thing the tests exercise.
 */
export function usePracticeTimer(active: boolean) {
  const recordPractice = useProgressStore((s) => s.recordPractice);

  // One clock per mounted screen. recordPractice is a stable zustand action,
  // so capturing it here is safe for the lifetime of the hook.
  const clockRef = useRef<PracticeClock | null>(null);
  if (clockRef.current === null) {
    clockRef.current = createPracticeClock({ record: recordPractice });
  }
  const clock = clockRef.current;

  useEffect(() => {
    if (!active) {
      clock.pause();
      return;
    }

    clock.resume();
    const interval = setInterval(() => clock.flush(), FLUSH_EVERY_MS);

    const sub = AppState.addEventListener('change', (state) => {
      clock.handleAppState(state);
    });

    return () => {
      clearInterval(interval);
      sub.remove();
      clock.pause();
    };
  }, [active, clock]);
}