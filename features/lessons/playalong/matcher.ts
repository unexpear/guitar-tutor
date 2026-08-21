import {
  Chord,
  getChord,
  chordPitchClasses,
  chordBassMidi,
  stringFretToMidi,
} from '../../chords/data/chords';

/**
 * Pure hit-detection logic for play-along drills, fed by the native tuner's
 * (monophonic) pitch stream.
 *
 * - 'mono': a single detected tone decides. Note targets need the exact
 *   pitch; chord targets accept any chord tone. Forgiving - right for
 *   beginners and noisy rooms.
 * - 'poly': chord targets need EVIDENCE OF MULTIPLE STRINGS. A monophonic
 *   detector's lock wanders across the ringing strings of a strummed chord
 *   frame by frame, so within a short window we require several DISTINCT
 *   chord pitch classes (optionally including the bass). A lone plucked
 *   string cannot satisfy it; a real strum can.
 */

export type DetectionMode = 'mono' | 'poly';

export type Target =
  | { kind: 'note'; stringIndex: number; fret: number; label: string }
  | { kind: 'chord'; chordName: string; label: string; strums?: number };

export interface PitchSample {
  frequency: number;
  confidence: number;
  rmsDb: number;
  /** Timestamp in ms (any monotonic clock). */
  tMs: number;
}

export interface MatcherConfig {
  mode: DetectionMode;
  /** Ignore samples below this detector confidence. */
  minConfidence: number;
  /** Mono note-target tolerance in cents. */
  noteToleranceCents: number;
  /** Accept the note an octave up as well (harmonic jumps on low strings). */
  allowOctaveUp: boolean;
  /** Consecutive matching samples required for a mono decision. */
  monoHold: number;
  /** Poly: evidence window after the first in-chord sample, in ms. */
  polyWindowMs: number;
  /** Poly: distinct chord pitch classes required (capped at the chord's own count). */
  polyMinClasses: number;
  /** Poly: the chord's bass pitch class must be among the evidence. */
  requireBassClass: boolean;
  /** Consecutive voiced non-matching samples that trigger a 'wrong' event. */
  wrongStreak: number;
}

export const DEFAULT_CONFIG: MatcherConfig = {
  mode: 'mono',
  minConfidence: 0.6,
  noteToleranceCents: 60,
  allowOctaveUp: true,
  monoHold: 2,
  polyWindowMs: 1500,
  polyMinClasses: 3,
  requireBassClass: true,
  wrongStreak: 4,
};

export interface MatchState {
  /** Distinct chord pitch classes heard so far (poly progress, for UI pips). */
  heardClasses: number[];
  /** Pitch classes the current chord target contains (stable order, low->high). */
  targetClasses: number[];
  /** Whether the bass class has been heard (poly). */
  bassHeard: boolean;
}

export type MatchEvent = 'hit' | 'wrong' | null;

function frequencyToMidiFloat(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440);
}

function pitchClassOf(midi: number): number {
  return ((Math.round(midi) % 12) + 12) % 12;
}

export function targetChord(target: Target): Chord | null {
  if (target.kind !== 'chord') return null;
  return getChord(target.chordName) ?? null;
}

export class TargetMatcher {
  private config: MatcherConfig;
  private target: Target;
  private chord: Chord | null;
  private chordClasses: Set<number>;
  private bassClass: number | null;
  private noteMidi: number | null;

  private matchRun = 0;
  private wrongRun = 0;
  private heard = new Set<number>();
  private windowStart: number | null = null;
  private bassHeard = false;

  constructor(target: Target, config: Partial<MatcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.target = target;
    this.chord = targetChord(target);
    this.chordClasses = this.chord ? chordPitchClasses(this.chord) : new Set();
    this.bassClass = this.chord ? pitchClassOf(chordBassMidi(this.chord)) : null;
    this.noteMidi =
      target.kind === 'note' ? stringFretToMidi(target.stringIndex, target.fret) : null;
  }

  /** Reset per-target accumulation (call when a new target becomes active). */
  reset(): void {
    this.matchRun = 0;
    this.wrongRun = 0;
    this.heard.clear();
    this.windowStart = null;
    this.bassHeard = false;
  }

  state(): MatchState {
    return {
      heardClasses: [...this.heard],
      targetClasses: [...this.chordClasses].sort((a, b) => a - b),
      bassHeard: this.bassHeard,
    };
  }

  /** Feed one voiced pitch sample; returns 'hit', 'wrong', or null. */
  feed(sample: PitchSample): MatchEvent {
    if (sample.confidence < this.config.minConfidence || sample.frequency <= 0) {
      return null;
    }
    const midiFloat = frequencyToMidiFloat(sample.frequency);

    if (this.target.kind === 'note') {
      return this.feedNote(midiFloat);
    }
    if (this.config.mode === 'poly') {
      return this.feedChordPoly(midiFloat, sample.tMs);
    }
    return this.feedChordMono(midiFloat);
  }

  private feedNote(midiFloat: number): MatchEvent {
    const tolSemis = this.config.noteToleranceCents / 100;
    const target = this.noteMidi as number;
    const matches =
      Math.abs(midiFloat - target) <= tolSemis ||
      (this.config.allowOctaveUp && Math.abs(midiFloat - (target + 12)) <= tolSemis);

    if (matches) {
      this.wrongRun = 0;
      this.matchRun += 1;
      if (this.matchRun >= this.config.monoHold) return 'hit';
      return null;
    }
    this.matchRun = 0;
    this.wrongRun += 1;
    if (this.wrongRun >= this.config.wrongStreak) {
      this.wrongRun = 0;
      return 'wrong';
    }
    return null;
  }

  private feedChordMono(midiFloat: number): MatchEvent {
    const pc = pitchClassOf(midiFloat);
    if (this.chordClasses.has(pc)) {
      this.wrongRun = 0;
      this.matchRun += 1;
      this.heard.add(pc);
      if (pc === this.bassClass) this.bassHeard = true;
      if (this.matchRun >= this.config.monoHold) return 'hit';
      return null;
    }
    this.matchRun = 0;
    this.wrongRun += 1;
    if (this.wrongRun >= this.config.wrongStreak) {
      this.wrongRun = 0;
      return 'wrong';
    }
    return null;
  }

  private feedChordPoly(midiFloat: number, tMs: number): MatchEvent {
    const pc = pitchClassOf(midiFloat);

    if (this.chordClasses.has(pc)) {
      this.wrongRun = 0;
      if (this.windowStart === null) this.windowStart = tMs;
      // Evidence expires: strums land within the window; re-arm on stale.
      if (tMs - this.windowStart > this.config.polyWindowMs) {
        this.heard.clear();
        this.bassHeard = false;
        this.windowStart = tMs;
      }
      this.heard.add(pc);
      if (pc === this.bassClass) this.bassHeard = true;

      const needed = Math.min(this.config.polyMinClasses, this.chordClasses.size);
      const bassOk = !this.config.requireBassClass || this.bassHeard;
      if (this.heard.size >= needed && bassOk) return 'hit';
      return null;
    }

    this.wrongRun += 1;
    if (this.wrongRun >= this.config.wrongStreak) {
      this.wrongRun = 0;
      // A sustained wrong sound also invalidates gathered evidence.
      this.heard.clear();
      this.bassHeard = false;
      this.windowStart = null;
      return 'wrong';
    }
    return null;
  }
}
