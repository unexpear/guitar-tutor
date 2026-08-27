/**
 * The accounting model behind usePracticeTimer, as a pure, injectable clock.
 *
 * Practice time is measured against the wall clock, not counted in ticks:
 * a stalled JS thread (throttled timers, a hung screen) neither inflates nor
 * loses time, because every flush reads `now()` and settles the difference.
 *
 * The invariant being tested everywhere in tests/usePracticeTimer.test.ts:
 *
 *   accumulated practice == sum of foreground wall-clock intervals
 *
 * not "number of timer callbacks x interval". Backgrounding and app-state
 * transitions call pause(), which settles the open interval first.
 */

export interface PracticeClock {
  /** Start (or restart after a pause) counting foreground time. */
  begin(): void;
  /** Settle the open interval against the wall clock, then stop counting. */
  pause(): void;
  /** Resume after a pause; a no-op if already counting. */
  resume(): void;
  /** Settle the open interval and keep counting (the timer-tick callback). */
  flush(): void;
  /** Settle and stop counting; the unmount path. Never records twice. */
  dispose(): void;
  /**
   * App-state transitions. 'active' re-anchors so time spent backgrounded is
   * never credited; anything else settles the open interval and stops.
   */
  handleAppState(state: string): void;
  readonly running: boolean;
  /**
   * Foreground wall-clock seconds so far, including the interval still open
   * right now — before the sub-second discard on flush.
   */
  readonly accumulatedSeconds: number;
}

export function createPracticeClock(opts: {
  now?: () => number;
  record?: (elapsedSeconds: number) => void;
} = {}): PracticeClock {
  const nowFn = opts.now ?? Date.now;
  const record = opts.record ?? (() => {});
  const MIN_RECORD_SECONDS = 1;

  let startedAt: number | null = null;
  let totalSeconds = 0;

  /** Settle the open interval and move the anchor. Keeps counting. */
  const flush = () => {
    if (startedAt === null) return;
    const elapsed = (nowFn() - startedAt) / 1000;
    startedAt = nowFn();
    // Sub-second toggling is noise, not practice.
    if (elapsed >= MIN_RECORD_SECONDS) {
      totalSeconds += elapsed;
      record(elapsed);
    }
  };

  return {
    begin() {
      if (startedAt === null) startedAt = nowFn();
    },
    resume() {
      if (startedAt === null) startedAt = nowFn();
    },
    pause() {
      flush();
      startedAt = null;
    },
    flush,
    dispose() {
      flush();
      startedAt = null;
    },
    handleAppState(state: string) {
      if (state === 'active') {
        // Time backgrounded is not practice; re-anchor rather than count it.
        startedAt = nowFn();
      } else {
        flush();
        startedAt = null;
      }
    },
    get running() {
      return startedAt !== null;
    },
    get accumulatedSeconds() {
      const open = startedAt === null ? 0 : (nowFn() - startedAt) / 1000;
      return totalSeconds + open;
    },
  };
}