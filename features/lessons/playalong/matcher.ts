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
 *
 * Attack gating: plucked strings ring for seconds while the detector keeps
 * streaming in-tune frames, so pitch alone cannot distinguish "still
 * ringing" from "plucked again". The matcher therefore tracks the rmsDb
 * envelope and only lets a 'hit' or 'wrong' fire when it is ARMED by a
 * plausible new attack:
 *
 * - A fresh matcher (or reset()) starts PROVISIONALLY armed - the note may
 *   already be sounding when the target activates.
 * - The provisional arm is CONFIRMED by attack evidence: a loud
 *   low-confidence transient right before the first voiced frame (a soft
 *   pluck's pick noise settling into a tone), a steep early drop (a hard
 *   pluck's transient settling), or a level rise above the recent envelope.
 * - The provisional arm is REVOKED if the first frames show the signature
 *   of a ring joined mid-decay: the SAME pitch gently fading frame over
 *   frame, or (for chord rings, where the mono lock wanders string to
 *   string and beats make the level non-monotone) a net level decay across
 *   the first few frames with no attack evidence anywhere.
 * - Once disarmed, only a genuine new attack re-arms: an rmsDb rise that
 *   also reaches the recent envelope peak (a recovery out of a narrow beat
 *   null rises steeply but stays below the envelope), or a gap in voiced
 *   frames whose post-gap level is at/above what the old ring could still
 *   be at (a confidence dropout over a decaying ring re-locks SOFTER than
 *   the pre-gap level; a fresh pluck does not).
 * - Every emitted event ('hit' or 'wrong') consumes the arm, so one
 *   physical strum yields at most one event; a "strum 4 times" target
 *   really takes four attacks.
 *
 * While disarmed the matcher stays silent: the natural decay of the
 * previous (correct) chord or note never produces 'wrong' events, and the
 * ring-over of a shared tone never credits the next target.
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

// ---- Attack-gate tuning (dB / ms; sized for real guitars on phone mics) ----

/** rmsDb jump over the previous voiced frame that signals a new attack. */
const ONSET_RISE_DB = 2;
/**
 * Steep early drop that CONFIRMS a provisional arm: a pluck transient is
 * loud and settles fast, so "loud frame then >=2 dB fall" is an attack
 * signature, not a ring.
 */
const ATTACK_DROP_DB = 2;
/**
 * Gentle same-pitch fade (per ~frame) that REVOKES a provisional arm: a
 * freely ringing string decays ~0.2-0.5 dB per 33 ms frame. Seeing that
 * from the very first frames means the target activated mid-ring.
 */
const RING_DECAY_MIN_DB = 0.1;
/** Two frames are "the same pitch" within this many semitones. */
const SAME_PITCH_SEMIS = 0.6;
/**
 * A voiced-frame gap at least this long MAY be a fresh attack - but only if
 * the post-gap level is consistent with one (see RING_MIN_DECAY_DB_PER_MS).
 * Confidence dropouts over a still-ringing string (ambient masking, lock
 * ambiguity between beating strings) produce the same gap without any pluck.
 */
const REARM_GAP_MS = 300;
/**
 * Slowest plausible free decay of a ringing string (RING_DECAY_MIN_DB per
 * ~33 ms frame). Across a voiced-frame gap the old ring must have kept
 * fading at least this fast, so a post-gap level at/above
 * (pre-gap level - rate * gap) cannot be the old ring: it is a new attack.
 * The same rate decays the envelope peak used to vet ONSET_RISE_DB.
 */
const RING_MIN_DECAY_DB_PER_MS = RING_DECAY_MIN_DB / 33;
/**
 * Provisional-arm revoke for CHORD rings: the mono lock wanders string to
 * string (consecutive frames rarely share a pitch) and beating partials make
 * frame-to-frame level non-monotone, so the same-pitch rule alone misses
 * them. A net fade this deep across the first frames - regardless of pitch -
 * with no attack evidence means the target activated over a pre-existing
 * ring. Kept above typical RMS estimator jitter (~+-0.2 dB).
 */
const RING_NET_DECAY_DB = 0.3;
/** Frame pairs that must accumulate before the net-decay revoke applies. */
const RING_NET_MIN_PAIRS = 2;
/**
 * A pluck's pick transient is loud but unpitched: the detector reports it as
 * 1-2 low-confidence frames BEFORE the first voiced frame. If such a frame
 * landed within this window before the first voiced frame, at a level at
 * least (voiced level - margin), we caught the attack itself - the following
 * same-pitch early decay is the pluck settling, not a pre-existing ring.
 */
const TRANSIENT_WINDOW_MS = 150;
const TRANSIENT_LEVEL_MARGIN_DB = 1;

/**
 * Detector locks that are harmonics/subharmonics of the target, in
 * semitones above the target fundamental. YIN-family trackers report these
 * on real guitars (phone mics roll off below ~100 Hz, so low-string
 * fundamentals lose to their partials): -12 = period doubling (octave
 * down), +7 = octave-reduced twelfth, +12 = 2nd harmonic, +19 = 3rd
 * harmonic (twelfth), +24 = 4th harmonic. These frames are NEUTRAL for a
 * note target: they are not independent wrong-note evidence, but (except
 * for +12 via allowOctaveUp) they do not count toward the hit either.
 */
const HARMONIC_NEUTRAL_OFFSETS = [-12, 7, 12, 19, 24];

// ---- Poly relaxed-completion tuning ----

/**
 * Poly fallback: a triad's lone inner voice (e.g. the single C#4 of an
 * A-major shape) may never win the monophonic lock, so full class coverage
 * can be unreachable on a perfect strum. If the evidence stays in-chord
 * this long (and for this many frames) with one class missing but the bass
 * heard, that is already strong evidence of a real strum - credit it.
 */
const RELAXED_SUSTAIN_MS = 500;
const RELAXED_MIN_FRAMES = 8;
/**
 * Relaxed completion is VETOED while any single out-of-chord pitch class has
 * this many voiced frames in the evidence window: a wrong-but-similar chord
 * (Am against C, Em against G) keeps feeding shared classes while its own
 * root recurs frame after frame. Stray harmonic mislocks on a correct strum
 * never dwell on one foreign class this long.
 */
const OUT_CLASS_VETO_FRAMES = 4;
/**
 * Bass evidence must be octave-aware: a pitch-class match alone lets a
 * higher octave copy (Am's C4 string) impersonate a C3 bass. A detection
 * counts as the bass only in the bass register - within this many semitones
 * above the chord's actual bass note (period-doubled reports below it also
 * qualify).
 */
const BASS_REGISTER_SEMIS = 7;
/**
 * Rolloff fallback: phone mics lose fundamentals below ~100 Hz, so a low
 * bass (E2) may only ever be reported an octave up. Accept a higher
 * bass-class detection only when it is (within tolerance) the LOWEST pitch
 * seen for this target - if anything lower was detected, the real sounding
 * bass was reportable and it was not this note.
 */
const BASS_LOWEST_TOL_SEMIS = 0.6;

export interface MatchState {
  /** Distinct chord pitch classes heard so far (poly progress, for UI pips). */
  heardClasses: number[];
  /** Pitch classes the current chord target contains (stable order, low->high). */
  targetClasses: number[];
  /** Whether the bass class has been heard (poly). */
  bassHeard: boolean;
}

export type MatchEvent = 'hit' | 'wrong' | null;

type ArmState = 'provisional' | 'confirmed' | 'disarmed';

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
  private bassMidi: number | null;
  private noteMidi: number | null;

  private matchRun = 0;
  private wrongRun = 0;
  private heard = new Set<number>();
  private windowStart: number | null = null;
  private bassHeard = false;
  /** In-chord voiced frames inside the current poly evidence window. */
  private inChordFrames = 0;
  /** Voiced frames per OUT-of-chord pitch class in the evidence window. */
  private outClassFrames = new Map<number, number>();
  /** Lowest voiced pitch seen for this target (octave-aware bass check). */
  private minMidiSeen: number | null = null;

  // Attack-gate state (rms envelope across voiced frames).
  private armState: ArmState = 'provisional';
  private lastRmsDb: number | null = null;
  private lastMidi: number | null = null;
  private lastTMs: number | null = null;
  /** First voiced frame's level (baseline for the net-decay revoke). */
  private firstRmsDb: number | null = null;
  /** Consecutive-voiced frame pairs seen so far. */
  private pairCount = 0;
  /** Recent envelope peak, decayed at the minimum ring-decay rate. */
  private envPeakDb: number | null = null;
  /** Most recent below-confidence (unvoiced) frame - transient evidence. */
  private lastUnvoicedTMs: number | null = null;
  private lastUnvoicedRmsDb: number | null = null;

  constructor(target: Target, config: Partial<MatcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.target = target;
    this.chord = targetChord(target);
    this.chordClasses = this.chord ? chordPitchClasses(this.chord) : new Set();
    this.bassMidi = this.chord ? chordBassMidi(this.chord) : null;
    this.bassClass = this.bassMidi !== null ? pitchClassOf(this.bassMidi) : null;
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
    this.inChordFrames = 0;
    this.outClassFrames.clear();
    this.minMidiSeen = null;
    this.armState = 'provisional';
    this.lastRmsDb = null;
    this.lastMidi = null;
    this.lastTMs = null;
    this.firstRmsDb = null;
    this.pairCount = 0;
    this.envPeakDb = null;
    this.lastUnvoicedTMs = null;
    this.lastUnvoicedRmsDb = null;
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
      // Unvoiced frames still carry the rms envelope: a pluck's pick
      // transient shows up here, right before the first voiced frame.
      this.lastUnvoicedTMs = sample.tMs;
      this.lastUnvoicedRmsDb = sample.rmsDb;
      return null;
    }
    const midiFloat = frequencyToMidiFloat(sample.frequency);
    this.minMidiSeen =
      this.minMidiSeen === null ? midiFloat : Math.min(this.minMidiSeen, midiFloat);
    this.updateArming(midiFloat, sample.rmsDb, sample.tMs);
    const armed = this.armState !== 'disarmed';

    let event: MatchEvent;
    if (this.target.kind === 'note') {
      event = this.feedNote(midiFloat, armed);
    } else if (this.config.mode === 'poly') {
      event = this.feedChordPoly(midiFloat, sample.tMs, armed);
    } else {
      event = this.feedChordMono(midiFloat, armed);
    }

    // One event per physical attack: firing consumes the arm. Only a new
    // attack (rms rise or silence gap) re-arms.
    if (event !== null) this.armState = 'disarmed';
    return event;
  }

  private updateArming(midiFloat: number, rmsDb: number, tMs: number): void {
    if (this.lastTMs === null || this.lastRmsDb === null || this.lastMidi === null) {
      // First voiced frame. A loud unpitched transient just before it is
      // the attack itself (soft plucks settle into tone only after 1-2
      // low-confidence frames, then decay - which must NOT read as a ring).
      if (
        this.armState === 'provisional' &&
        this.lastUnvoicedTMs !== null &&
        this.lastUnvoicedRmsDb !== null &&
        tMs - this.lastUnvoicedTMs <= TRANSIENT_WINDOW_MS &&
        this.lastUnvoicedRmsDb >= rmsDb - TRANSIENT_LEVEL_MARGIN_DB
      ) {
        this.armState = 'confirmed';
      }
      this.firstRmsDb = rmsDb;
      this.envPeakDb = rmsDb;
    } else {
      const dtMs = tMs - this.lastTMs;
      const dDb = rmsDb - this.lastRmsDb;
      this.pairCount += 1;
      const decayedPeak =
        (this.envPeakDb ?? rmsDb) - RING_MIN_DECAY_DB_PER_MS * Math.max(0, dtMs);
      // Dropout gap: a new attack only if the level is at/above where the
      // old ring could still be (it kept decaying through the gap).
      const gapAttack =
        dtMs >= REARM_GAP_MS &&
        rmsDb >= this.lastRmsDb - RING_MIN_DECAY_DB_PER_MS * dtMs;
      // Level jump: a new attack only if it reaches the recent envelope
      // peak - recovery out of a narrow beat null rises steeply but stays
      // below the envelope of the ring it belongs to.
      const riseAttack = dDb >= ONSET_RISE_DB && rmsDb >= decayedPeak;
      if (gapAttack || riseAttack) {
        this.armState = 'confirmed';
      } else if (this.armState === 'provisional') {
        if (dDb <= -ATTACK_DROP_DB && dtMs < REARM_GAP_MS) {
          // Loud transient settling fast: we caught the attack itself.
          this.armState = 'confirmed';
        } else if (
          dDb <= -RING_DECAY_MIN_DB &&
          Math.abs(midiFloat - this.lastMidi) <= SAME_PITCH_SEMIS
        ) {
          // Same pitch gently fading from the very start: joined mid-ring.
          this.armState = 'disarmed';
        } else if (
          this.pairCount >= RING_NET_MIN_PAIRS &&
          this.firstRmsDb !== null &&
          rmsDb <= this.firstRmsDb - RING_NET_DECAY_DB
        ) {
          // Wandering-lock chord ring: pitches differ frame to frame and
          // beats wiggle the level, but the NET trend since activation is
          // a fade with no attack anywhere - joined mid-ring.
          this.armState = 'disarmed';
        }
      }
      this.envPeakDb = Math.max(rmsDb, decayedPeak);
    }
    this.lastTMs = tMs;
    this.lastRmsDb = rmsDb;
    this.lastMidi = midiFloat;
  }

  /**
   * Octave-aware bass evidence: the detection must be IN the bass register
   * (within BASS_REGISTER_SEMIS above the chord's bass note; period-doubled
   * reports below it also land here), or - for sub-100Hz basses phone mics
   * cannot report at pitch - be the lowest pitch seen for this target.
   */
  private isBassEvidence(midiFloat: number, pc: number): boolean {
    if (this.bassClass === null || pc !== this.bassClass) return false;
    if (this.bassMidi === null) return true;
    if (midiFloat <= this.bassMidi + BASS_REGISTER_SEMIS) return true;
    return this.minMidiSeen !== null && midiFloat <= this.minMidiSeen + BASS_LOWEST_TOL_SEMIS;
  }

  private feedNote(midiFloat: number, armed: boolean): MatchEvent {
    const tolSemis = this.config.noteToleranceCents / 100;
    const target = this.noteMidi as number;
    const matches =
      Math.abs(midiFloat - target) <= tolSemis ||
      (this.config.allowOctaveUp && Math.abs(midiFloat - (target + 12)) <= tolSemis);

    if (matches) {
      this.wrongRun = 0;
      this.matchRun += 1;
      if (armed && this.matchRun >= this.config.monoHold) return 'hit';
      return null;
    }

    // Harmonic-family locks on the target are detector errors on a
    // correctly played note, never wrong-note evidence.
    for (const offset of HARMONIC_NEUTRAL_OFFSETS) {
      if (Math.abs(midiFloat - (target + offset)) <= tolSemis) return null;
    }

    this.matchRun = 0;
    if (!armed) return null;
    this.wrongRun += 1;
    if (this.wrongRun >= this.config.wrongStreak) {
      this.wrongRun = 0;
      return 'wrong';
    }
    return null;
  }

  private feedChordMono(midiFloat: number, armed: boolean): MatchEvent {
    const pc = pitchClassOf(midiFloat);
    if (this.chordClasses.has(pc)) {
      this.wrongRun = 0;
      this.matchRun += 1;
      this.heard.add(pc);
      if (this.isBassEvidence(midiFloat, pc)) this.bassHeard = true;
      if (armed && this.matchRun >= this.config.monoHold) return 'hit';
      return null;
    }
    this.matchRun = 0;
    if (!armed) return null;
    this.wrongRun += 1;
    if (this.wrongRun >= this.config.wrongStreak) {
      this.wrongRun = 0;
      return 'wrong';
    }
    return null;
  }

  private feedChordPoly(midiFloat: number, tMs: number, armed: boolean): MatchEvent {
    const pc = pitchClassOf(midiFloat);

    if (this.chordClasses.has(pc)) {
      this.wrongRun = 0;
      if (this.windowStart === null) {
        this.windowStart = tMs;
        this.inChordFrames = 0;
      }
      // Evidence expires: strums land within the window; re-arm on stale.
      if (tMs - this.windowStart > this.config.polyWindowMs) {
        this.heard.clear();
        this.bassHeard = false;
        this.windowStart = tMs;
        this.inChordFrames = 0;
        this.outClassFrames.clear();
      }
      this.inChordFrames += 1;
      this.heard.add(pc);
      if (this.isBassEvidence(midiFloat, pc)) this.bassHeard = true;

      if (!armed) return null;

      const needed = Math.min(this.config.polyMinClasses, this.chordClasses.size);
      const bassOk = !this.config.requireBassClass || this.bassHeard;
      if (this.heard.size >= needed && bassOk) return 'hit';

      // Relaxed completion: one class short (a lone inner voice the mono
      // lock never visits), but the bass was heard and the evidence has
      // stayed in-chord long enough to be a real strum. VETOED while any
      // single out-of-chord class keeps recurring: a neighboring wrong
      // chord (Am vs C) shares two classes but its own root dwells frame
      // after frame - that sound is a different chord, not a thin strum.
      let outVeto = false;
      for (const count of this.outClassFrames.values()) {
        if (count >= OUT_CLASS_VETO_FRAMES) {
          outVeto = true;
          break;
        }
      }
      const relaxedNeeded = Math.max(2, needed - 1);
      if (
        !outVeto &&
        this.heard.size >= relaxedNeeded &&
        this.bassHeard &&
        tMs - this.windowStart >= RELAXED_SUSTAIN_MS &&
        this.inChordFrames >= RELAXED_MIN_FRAMES
      ) {
        return 'hit';
      }
      return null;
    }

    this.outClassFrames.set(pc, (this.outClassFrames.get(pc) ?? 0) + 1);
    if (!armed) return null;
    this.wrongRun += 1;
    if (this.wrongRun >= this.config.wrongStreak) {
      this.wrongRun = 0;
      // A sustained wrong sound also invalidates gathered evidence.
      this.heard.clear();
      this.bassHeard = false;
      this.windowStart = null;
      this.inChordFrames = 0;
      this.outClassFrames.clear();
      return 'wrong';
    }
    return null;
  }
}
