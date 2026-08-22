/**
 * Drift-corrected beat scheduler shared by the metronome and the play-along
 * drills.
 *
 * Each tick is timed against the wall clock rather than chaining fixed
 * intervals, so rounding error does not accumulate. Crucially it also
 * RESYNCS instead of catching up: if the JS thread stalls (app backgrounded,
 * a long GC pause, a slow render) a naive drift-corrected loop computes a
 * zero delay for every missed beat and fires them all at once as a burst of
 * clicks. Beats that are already in the past are dropped instead.
 */

export interface BeatClockOptions {
  /** Beats per minute; read fresh on every tick so tempo changes need no restart. */
  getBpm: () => number;
  /** Beats per bar; read fresh so time-signature changes need no restart. */
  getBeatsPerBar: () => number;
  /** Called on every beat with the beat index within the bar (0-based). */
  onBeat: (beatInBar: number, scheduledAt: number) => void;
  /** Beats to count in before onBeat starts reporting bar positions. */
  countInBeats?: number;
  /** Called for each count-in beat, counting down (e.g. 4, 3, 2, 1). */
  onCountIn?: (remaining: number) => void;
  /** Called once the count-in finishes and the first real beat is due. */
  onStart?: () => void;
}

export interface BeatClock {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

export function createBeatClock(opts: BeatClockOptions): BeatClock {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  const stop = () => {
    running = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const start = () => {
    stop();
    running = true;

    let beat = 0;
    let countIn = Math.max(0, opts.countInBeats ?? 0);
    let nextTickAt = Date.now();

    const tick = () => {
      if (!running) return;

      if (countIn > 0) {
        opts.onCountIn?.(countIn);
        countIn -= 1;
        if (countIn === 0) opts.onStart?.();
      } else {
        opts.onBeat(beat, nextTickAt);
        beat = (beat + 1) % Math.max(1, opts.getBeatsPerBar());
      }

      const interval = (60 / Math.max(1, opts.getBpm())) * 1000;
      nextTickAt += interval;

      const now = Date.now();
      if (now - nextTickAt > interval) {
        // We fell more than a whole beat behind. Drop the missed beats and
        // realign to the current moment rather than firing them in a burst.
        nextTickAt = now + interval;
      }

      timer = setTimeout(tick, Math.max(0, nextTickAt - Date.now()));
    };

    tick();
  };

  return { start, stop, isRunning: () => running };
}

/**
 * How far a played attack sits from the beat it belongs to.
 * Negative = early (rushing), positive = late (dragging).
 */
export function timingOffsetMs(playedAt: number, beatAt: number): number {
  return playedAt - beatAt;
}

export type TimingVerdict = 'perfect' | 'good' | 'early' | 'late';

/** Grade an attack against the beat. Windows are generous: this is for beginners. */
export function gradeTiming(offsetMs: number): TimingVerdict {
  const a = Math.abs(offsetMs);
  if (a <= 60) return 'perfect';
  if (a <= 140) return 'good';
  return offsetMs < 0 ? 'early' : 'late';
}
