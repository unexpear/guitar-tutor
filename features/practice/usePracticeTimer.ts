import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useProgressStore } from '../store/progressStore';

/** How often a long session is written down, so a crash loses little. */
const FLUSH_EVERY_MS = 30_000;

/**
 * Counts time spent actually doing something with the guitar and files it
 * against today.
 *
 * Pass whatever the screen already knows about being busy — the tuner
 * listening, the metronome running, a drill in progress. Time is measured
 * against the wall clock rather than counted in ticks, so a stalled JS
 * thread cannot inflate or lose it, and the session is flushed when the app
 * goes to the background (Android may never run our cleanup otherwise).
 */
export function usePracticeTimer(active: boolean) {
  const recordPractice = useProgressStore((s) => s.recordPractice);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    const flush = () => {
      if (startedAt.current === null) return;
      const elapsed = (Date.now() - startedAt.current) / 1000;
      startedAt.current = Date.now();
      // Ignore sub-second noise from rapid toggling.
      if (elapsed >= 1) recordPractice(elapsed);
    };

    if (!active) {
      flush();
      startedAt.current = null;
      return;
    }

    startedAt.current = Date.now();
    const interval = setInterval(flush, FLUSH_EVERY_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Time spent backgrounded is not practice.
        startedAt.current = Date.now();
      } else {
        flush();
        startedAt.current = null;
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
      flush();
      startedAt.current = null;
    };
  }, [active, recordPractice]);
}
