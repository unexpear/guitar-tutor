import { Drill } from '../data/drills';
import { Target } from './matcher';

/** Follow Me does not grade timing, so its score must not lose timing points. */
export function practiceScore(pitchScore: number, timingScore: number, gradeTiming: boolean): number {
  return Math.round(gradeTiming ? pitchScore * 0.6 + timingScore * 0.4 : pitchScore);
}

/** Duration of one chart target. Song targets carry exact quarter-note beats. */
export function targetDurationMs(drill: Drill, target: Target): number {
  if (drill.bpm && target.beats && target.beats > 0) {
    return target.beats * (60_000 / drill.bpm);
  }

  // Preserve the established pacing of non-song chord drills.
  const repetitions = target.kind === 'chord' ? target.strums ?? 1 : 1;
  return drill.secondsPerTarget * 1000 * Math.max(1, repetitions / 2);
}
