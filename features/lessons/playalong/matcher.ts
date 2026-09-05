import {
  Chord,
  getChord,
  chordPitchClasses,
  chordBassMidi,
  chordMidiNotes,
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
 * - If the first frames instead show the signature of a ring joined
 *   mid-decay - the SAME pitch gently fading frame over frame, or (for
 *   chord rings, where the mono lock wanders string to string) a net level
 *   decay with no attack evidence anywhere - the matcher enters the
 *   RING-JOINED state. In continuous play-along the next target activates
 *   ON the beat while correct attacks scatter 30-80 ms EARLY, so the attack
 *   transient routinely lands in the previous target's matcher and the
 *   fresh matcher sees only the young ring. A ring whose content MATCHES
 *   the target is therefore still credited (with a stiffer hold for mono
 *   decisions); a non-matching ring is the previous sound's ring-over and
 *   stays silent - it never produces 'wrong' events.
 * - Once an event has fired the gate is DISARMED; only a genuine new attack
 *   re-arms: a level rise (vetted against beat-null recovery - a rise
 *   right after a steep dip must also reach the decayed envelope peak), a
 *   softer-but-genuine attack that reverses a decaying trend (real dynamics
 *   put up-strums and fingerstyle plucks 5-15 dB below the last strum, so
 *   re-arm evidence must not require matching the loudest recent level), or
 *   a gap in voiced frames whose post-gap level is either at/above what the
 *   old ring could still be, or well above the unvoiced noise floor seen
 *   during the gap (damped/palm-muted strings kill the old ring, so any
 *   clearly louder re-entry is a new attack).
 * - Every emitted event ('hit' or 'wrong') consumes the arm, so one
 *   physical strum yields at most one event; a "strum 4 times" target
 *   really takes four attacks.
 *
 * Harmonic mislocks: YIN-family trackers sporadically lock onto harmonics
 * of ringing strings (+19 = 3rd harmonic, +7 = octave-reduced twelfth...).
 * Those frames are NEUTRAL - never wrong-note or out-of-chord evidence -
 * but neutrality is BOUNDED: a real mislock is a 1-5 frame artifact around
 * the attack or a sporadic blip amid genuine target frames. A sustained
 * solid lock at a harmonic offset with no target evidence anywhere in the
 * ring is a genuinely played wrong string (open B against low E is exactly
 * +19) and counts as wrong evidence.
 */

export type DetectionMode = 'mono' | 'poly';

export type Target =
  | { kind: 'note'; stringIndex: number; fret: number; label: string; beats?: number }
  | { kind: 'chord'; chordName: string; label: string; strums?: number; beats?: number };

export interface PitchSample {
  frequency: number;
  confidence: number;
  rmsDb: number;
  /** Timestamp in ms (any monotonic clock). */
  tMs: number;
}

export interface MatcherConfig {
  mode: DetectionMode;
  /** Concert pitch used to turn measured frequency into a MIDI-note offset. */
  referencePitchHz: number;
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
  referencePitchHz: 440,
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
 * signature, not a ring. The same threshold marks a beat-null DIP: a rise
 * arriving within DIP_GUARD_MS of such a drop is treated as null recovery
 * unless it also reaches the decayed envelope peak.
 */
const ATTACK_DROP_DB = 2;
/**
 * Gentle same-pitch fade (per ~frame) that sends a provisional arm to the
 * RING-JOINED state: a freely ringing string decays ~0.2-0.5 dB per 33 ms
 * frame. Seeing that from the very first frames means the target activated
 * mid-ring - which, at a beat handoff, may be the player's own slightly
 * early attack (see class docs).
 */
const RING_DECAY_MIN_DB = 0.1;
/** Two frames are "the same pitch" within this many semitones. */
const SAME_PITCH_SEMIS = 0.6;
/**
 * A voiced-frame gap at least this long MAY be a fresh attack - but only if
 * the post-gap level is consistent with one (see RING_MIN_DECAY_DB_PER_MS
 * and SILENCE_RISE_DB). Confidence dropouts over a still-ringing string
 * (ambient masking, lock ambiguity between beating strings) produce the
 * same gap without any pluck.
 */
const REARM_GAP_MS = 300;
/**
 * Slowest plausible free decay of a ringing string (RING_DECAY_MIN_DB per
 * ~33 ms frame). Across a voiced-frame gap the old ring must have kept
 * fading at least this fast, so a post-gap level at/above
 * (pre-gap level - rate * gap) cannot be the old ring: it is a new attack.
 * The same rate decays the envelope peak used to vet beat-null recovery.
 */
const RING_MIN_DECAY_DB_PER_MS = RING_DECAY_MIN_DB / 33;
/**
 * Gap re-arm, silence-floor path: if unvoiced frames DURING the gap showed
 * the level collapsing (player damped/muted the strings, so the old ring is
 * dead), any post-gap lock this far above that floor is a new attack even
 * when it is much softer than the pre-gap ring. A confidence dropout over a
 * ring that keeps sounding leaves the unvoiced rms near the ring's level,
 * so it cannot pass this.
 */
const SILENCE_RISE_DB = 6;
/**
 * A rise within this window after a steep (>= ATTACK_DROP_DB) drop is
 * suspected beat-null recovery and must reach the decayed envelope peak to
 * count as an attack. Rises with no recent dip need no peak test: free
 * decay never rises, so ONSET_RISE_DB over the previous frame is already a
 * new attack no matter how far below the loudest recent event it is
 * (up-strums and fingerstyle plucks run 5-15 dB softer than a full strum).
 */
const DIP_GUARD_MS = 250;
/**
 * Trend-reversal attack: a genuinely new soft attack over a still-decaying
 * ring may lift the level by well under ONSET_RISE_DB (energy summing gives
 * < 2 dB when the new attack is softer than the ring). But a free ring can
 * only fade - so a level this far ABOVE the projected continuation of the
 * observed decay trend, with no recent beat-null dip, is a new attack. Kept
 * above RMS estimator jitter (~+-0.2 dB) plus beat wiggle (~+-0.25 dB).
 */
const REVERSAL_MARGIN_DB = 0.7;
/** Frame pairs no farther apart than this feed the decay-trend estimate. */
const TREND_FRAME_MAX_MS = 132;
/**
 * Chord-ring signature that sends a provisional arm to RING-JOINED: the
 * mono lock wanders string to string (consecutive frames rarely share a
 * pitch) and beating partials make frame-to-frame level non-monotone, so
 * the same-pitch rule alone misses it. A net fade this deep across the
 * first frames - regardless of pitch - with no attack evidence means the
 * target activated over an already-sounding ring. Kept above typical RMS
 * estimator jitter (~+-0.2 dB).
 */
const RING_NET_DECAY_DB = 0.3;
/** Frame pairs that must accumulate before the net-decay signature applies. */
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
 * Neutrality is bounded by HARMONIC_MAX_RUN below.
 */
const HARMONIC_NEUTRAL_OFFSETS = [-12, 7, 12, 19, 24];
/**
 * Harmonic offsets of a chord's SOUNDING notes that land on a foreign pitch
 * class (+12/+24/-12 keep the class and need no special case). Checked
 * octave-specifically against the chord's actual voicing, so only real
 * twelfth/3rd-harmonic mislocks qualify - not any note 7 semitones above
 * any chord class.
 */
const CHORD_HARMONIC_OFFSETS = [7, 19];
/**
 * Bound on harmonic neutrality: real harmonic mislocks are 1-5 frame attack
 * artifacts, or sporadic blips amid genuine target frames. A CONSECUTIVE
 * run at a harmonic offset longer than this, in a ring where the target
 * itself was never heard, is a played wrong note (the classic wrong-open-
 * string error lands exactly on +19 of the two lowest open strings) and
 * must produce 'wrong' feedback, not silence.
 */
const HARMONIC_MAX_RUN = 5;

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
 * are neutralized before they reach this counter (CHORD_HARMONIC_OFFSETS).
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
 * bass (E2 82 Hz ... G2 98 Hz) may only ever be reported an octave up. For
 * such basses a bass-class detection AT the octave (bass + 12) is accepted
 * as bass evidence outright: other in-chord strings above the bass (the E
 * chord's B2, the G chord's B2/D3) are fully reportable and may win the
 * first lock, so "lowest pitch seen" must not gate the fallback - which
 * string locks first after a broadband strum transient is a coin flip.
 */
const ROLLOFF_BASS_MAX_MIDI = 43.5; // G2 (98 Hz) and below
/**
 * Looser fallback for reportable basses: accept a higher bass-class
 * detection when it is (within tolerance) the LOWEST pitch seen for this
 * target - if anything lower was detected, the real sounding bass was
 * reportable and it was not this note.
 */
const BASS_LOWEST_TOL_SEMIS = 0.6;

export interface MatchState {
  /** Distinct chord pitch classes heard so far (poly progress, for UI pips). */
  heardClasses: number[];
  /** Pitch classes the current chord target contains (stable order, low->high). */
  targetClasses: number[];
  /** Whether the bass class has been heard (poly). */
  bassHeard: boolean;
  /** Matching voiced frames gathered toward the current decision. */
  matchingEvidence: number;
}

export type MatchEvent = 'hit' | 'wrong' | null;

type ArmState = 'provisional' | 'confirmed' | 'ringJoined' | 'disarmed';

function frequencyToMidiFloat(frequency: number, referencePitchHz: number): number {
  const a4 =
    Number.isFinite(referencePitchHz) && referencePitchHz > 0
      ? referencePitchHz
      : 440;
  return 69 + 12 * Math.log2(frequency / a4);
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
  /** Actual sounding MIDI notes of the chord voicing (octave-specific). */
  private chordMidis: number[];
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
  /** First voiced frame's level (baseline for the net-decay signature). */
  private firstRmsDb: number | null = null;
  /** Consecutive-voiced frame pairs seen so far. */
  private pairCount = 0;
  /** Recent envelope peak, decayed at the minimum ring-decay rate. */
  private envPeakDb: number | null = null;
  /** Most recent below-confidence (unvoiced) frame - transient evidence. */
  private lastUnvoicedTMs: number | null = null;
  private lastUnvoicedRmsDb: number | null = null;
  /** Smoothed observed decay rate of the current ring (dB per ms, >= 0). */
  private decayRatePerMs: number | null = null;
  /** Time of the last steep (beat-null-like) level drop. */
  private lastDipTMs: number | null = null;
  /** Consecutive voiced frames locked at a harmonic-neutral offset. */
  private harmonicRun = 0;
  /** Whether target evidence was heard since the last attack (ring start). */
  private targetSeenInRing = false;

  constructor(target: Target, config: Partial<MatcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.target = target;
    this.chord = targetChord(target);
    this.chordClasses = this.chord ? chordPitchClasses(this.chord) : new Set();
    this.chordMidis = this.chord ? chordMidiNotes(this.chord) : [];
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
    this.decayRatePerMs = null;
    this.lastDipTMs = null;
    this.harmonicRun = 0;
    this.targetSeenInRing = false;
  }

  state(): MatchState {
    return {
      heardClasses: [...this.heard],
      targetClasses: [...this.chordClasses].sort((a, b) => a - b),
      bassHeard: this.bassHeard,
      matchingEvidence: Math.max(this.matchRun, this.inChordFrames),
    };
  }

  /** Feed one voiced pitch sample; returns 'hit', 'wrong', or null. */
  feed(sample: PitchSample): MatchEvent {
    if (sample.confidence < this.config.minConfidence || sample.frequency <= 0) {
      // Unvoiced frames still carry the rms envelope: a pluck's pick
      // transient shows up here, right before the first voiced frame - and
      // the collapsed floor of damped strings shows up here too.
      this.lastUnvoicedTMs = sample.tMs;
      this.lastUnvoicedRmsDb = sample.rmsDb;
      return null;
    }
    const midiFloat = frequencyToMidiFloat(
      sample.frequency,
      this.config.referencePitchHz,
    );
    this.minMidiSeen =
      this.minMidiSeen === null ? midiFloat : Math.min(this.minMidiSeen, midiFloat);
    this.updateArming(midiFloat, sample.rmsDb, sample.tMs);

    // Ring-joined: the target activated over an already-sounding ring. At a
    // beat handoff that ring is usually the player's own slightly-early
    // attack, so hits stay possible (with a stiffer hold for mono
    // decisions) - but the previous sound's ring-over must never read as a
    // played wrong note, so wrong evidence is suppressed.
    const armedHit = this.armState !== 'disarmed';
    const armedWrong = this.armState === 'provisional' || this.armState === 'confirmed';
    const hold =
      this.armState === 'ringJoined' ? this.config.monoHold * 2 : this.config.monoHold;

    let event: MatchEvent;
    if (this.target.kind === 'note') {
      event = this.feedNote(midiFloat, armedHit, armedWrong, hold);
    } else if (this.config.mode === 'poly') {
      event = this.feedChordPoly(midiFloat, sample.tMs, armedHit, armedWrong);
    } else {
      event = this.feedChordMono(midiFloat, armedHit, armedWrong, hold);
    }

    // One event per physical attack: firing consumes the arm. Only a new
    // attack (rms rise, trend reversal, or silence gap) re-arms.
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
      const recentDip = this.lastDipTMs !== null && tMs - this.lastDipTMs <= DIP_GUARD_MS;
      // Silence-floor evidence: unvoiced frames during the gap showed the
      // old ring dead (player damped), so a clearly louder re-entry is a
      // new attack even when far softer than the pre-gap ring.
      const silenceFloor =
        this.lastUnvoicedTMs !== null &&
        this.lastUnvoicedRmsDb !== null &&
        this.lastUnvoicedTMs > this.lastTMs &&
        rmsDb >= this.lastUnvoicedRmsDb + SILENCE_RISE_DB;
      // Dropout gap: a new attack if the level is at/above where the old
      // ring could still be (it kept decaying through the gap), or if the
      // gap's unvoiced floor shows the old ring was killed.
      const gapAttack =
        dtMs >= REARM_GAP_MS &&
        (rmsDb >= this.lastRmsDb - RING_MIN_DECAY_DB_PER_MS * dtMs || silenceFloor);
      // Level jump: free decay never rises, so a >= ONSET_RISE_DB rise is a
      // new attack regardless of the recent envelope peak - EXCEPT right
      // after a steep dip, where it may be recovery out of a narrow beat
      // null and must also reach the decayed envelope of its own ring.
      const riseAttack = dDb >= ONSET_RISE_DB && (!recentDip || rmsDb >= decayedPeak);
      // Trend reversal: a softer new attack over a decaying ring lifts the
      // level by less than ONSET_RISE_DB (energy summing), but a free ring
      // can only keep fading - a level clearly above the projected
      // continuation of the observed decay is a new attack.
      const reversalAttack =
        !recentDip &&
        dtMs > 0 &&
        dtMs < REARM_GAP_MS &&
        this.pairCount >= 3 &&
        this.decayRatePerMs !== null &&
        this.decayRatePerMs >= RING_MIN_DECAY_DB_PER_MS &&
        rmsDb >= this.lastRmsDb - this.decayRatePerMs * dtMs + REVERSAL_MARGIN_DB;
      if (gapAttack || riseAttack || reversalAttack) {
        // A new attack starts a new ring: reset per-ring evidence.
        this.armState = 'confirmed';
        this.targetSeenInRing = false;
        this.harmonicRun = 0;
      } else if (this.armState === 'provisional') {
        if (dDb <= -ATTACK_DROP_DB && dtMs < REARM_GAP_MS) {
          // Loud transient settling fast: we caught the attack itself.
          this.armState = 'confirmed';
        } else if (
          dDb <= -RING_DECAY_MIN_DB &&
          Math.abs(midiFloat - this.lastMidi) <= SAME_PITCH_SEMIS
        ) {
          // Same pitch gently fading from the very start: joined mid-ring.
          this.armState = 'ringJoined';
        } else if (
          this.pairCount >= RING_NET_MIN_PAIRS &&
          this.firstRmsDb !== null &&
          rmsDb <= this.firstRmsDb - RING_NET_DECAY_DB
        ) {
          // Wandering-lock chord ring: pitches differ frame to frame and
          // beats wiggle the level, but the NET trend since activation is
          // a fade with no attack anywhere - joined mid-ring.
          this.armState = 'ringJoined';
        }
      }
      // Track dips and the observed decay trend AFTER judging this frame.
      if (dDb <= -ATTACK_DROP_DB) this.lastDipTMs = tMs;
      if (dtMs > 0 && dtMs <= TREND_FRAME_MAX_MS && dDb <= 0) {
        const rate = -dDb / dtMs;
        this.decayRatePerMs =
          this.decayRatePerMs === null ? rate : 0.5 * this.decayRatePerMs + 0.5 * rate;
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
   * reports below it also land here). For sub-100Hz basses phone mics
   * cannot report at pitch, the octave-up report (bass + 12) counts
   * outright - other in-chord strings above the bass are reportable and may
   * lock first, so this must not depend on detection order. For reportable
   * basses a higher bass-class report still counts when it is the lowest
   * pitch seen for this target.
   */
  private isBassEvidence(midiFloat: number, pc: number): boolean {
    if (this.bassClass === null || pc !== this.bassClass) return false;
    if (this.bassMidi === null) return true;
    if (midiFloat <= this.bassMidi + BASS_REGISTER_SEMIS) return true;
    if (
      this.bassMidi <= ROLLOFF_BASS_MAX_MIDI &&
      Math.abs(midiFloat - (this.bassMidi + 12)) <= BASS_LOWEST_TOL_SEMIS
    ) {
      return true;
    }
    return this.minMidiSeen !== null && midiFloat <= this.minMidiSeen + BASS_LOWEST_TOL_SEMIS;
  }

  /**
   * Whether a detection sits at a class-changing harmonic offset (+7
   * octave-reduced twelfth, +19 twelfth) of a note the chord voicing
   * actually sounds. Octave-specific on purpose: only real mislock targets
   * qualify, so genuine foreign chord roots still count as wrong evidence.
   */
  private isChordHarmonic(midiFloat: number): boolean {
    const tolSemis = this.config.noteToleranceCents / 100;
    for (const chordMidi of this.chordMidis) {
      for (const offset of CHORD_HARMONIC_OFFSETS) {
        if (Math.abs(midiFloat - (chordMidi + offset)) <= tolSemis) return true;
      }
    }
    return false;
  }

  /**
   * Bounded harmonic neutrality: returns true while this harmonic-offset
   * frame should stay neutral. Real mislocks are short attack artifacts
   * (run <= HARMONIC_MAX_RUN) or sporadic blips in a ring where the target
   * itself is also being heard. A long solid dwell with no target evidence
   * is a played wrong note and must NOT stay neutral.
   */
  private harmonicNeutral(): boolean {
    this.harmonicRun += 1;
    return this.harmonicRun <= HARMONIC_MAX_RUN || this.targetSeenInRing;
  }

  private feedNote(
    midiFloat: number,
    armedHit: boolean,
    armedWrong: boolean,
    hold: number
  ): MatchEvent {
    const tolSemis = this.config.noteToleranceCents / 100;
    const target = this.noteMidi as number;
    const matches =
      Math.abs(midiFloat - target) <= tolSemis ||
      (this.config.allowOctaveUp && Math.abs(midiFloat - (target + 12)) <= tolSemis);

    if (matches) {
      this.wrongRun = 0;
      this.harmonicRun = 0;
      this.targetSeenInRing = true;
      this.matchRun += 1;
      if (armedHit && this.matchRun >= hold) return 'hit';
      return null;
    }

    // Harmonic-family locks on the target are detector errors on a
    // correctly played note - but only within the neutrality bound: a
    // sustained lone lock at +19 is the wrong open string, not a mislock.
    let harmonic = false;
    for (const offset of HARMONIC_NEUTRAL_OFFSETS) {
      if (Math.abs(midiFloat - (target + offset)) <= tolSemis) {
        harmonic = true;
        break;
      }
    }
    if (harmonic) {
      if (this.harmonicNeutral()) return null;
    } else {
      this.harmonicRun = 0;
    }

    this.matchRun = 0;
    if (!armedWrong) return null;
    this.wrongRun += 1;
    if (this.wrongRun >= this.config.wrongStreak) {
      this.wrongRun = 0;
      return 'wrong';
    }
    return null;
  }

  private feedChordMono(
    midiFloat: number,
    armedHit: boolean,
    armedWrong: boolean,
    hold: number
  ): MatchEvent {
    const pc = pitchClassOf(midiFloat);
    if (this.chordClasses.has(pc)) {
      this.wrongRun = 0;
      this.harmonicRun = 0;
      this.targetSeenInRing = true;
      this.matchRun += 1;
      this.heard.add(pc);
      if (this.isBassEvidence(midiFloat, pc)) this.bassHeard = true;
      if (armedHit && this.matchRun >= hold) return 'hit';
      return null;
    }
    if (this.isChordHarmonic(midiFloat)) {
      if (this.harmonicNeutral()) return null;
    } else {
      this.harmonicRun = 0;
    }
    this.matchRun = 0;
    if (!armedWrong) return null;
    this.wrongRun += 1;
    if (this.wrongRun >= this.config.wrongStreak) {
      this.wrongRun = 0;
      return 'wrong';
    }
    return null;
  }

  private feedChordPoly(
    midiFloat: number,
    tMs: number,
    armedHit: boolean,
    armedWrong: boolean
  ): MatchEvent {
    const pc = pitchClassOf(midiFloat);

    if (this.chordClasses.has(pc)) {
      this.wrongRun = 0;
      this.harmonicRun = 0;
      this.targetSeenInRing = true;
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

      if (!armedHit) return null;

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

    // Twelfth/3rd-harmonic mislocks on the chord's own strings land on a
    // foreign pitch class but are the detector's error, not the player's:
    // they must feed neither the out-class veto nor the wrong streak
    // (within the neutrality bound).
    if (this.isChordHarmonic(midiFloat)) {
      if (this.harmonicNeutral()) return null;
    } else {
      this.harmonicRun = 0;
    }

    // Ring-over / post-event frames are not the player's judged sound:
    // they feed neither the veto nor the wrong streak.
    if (!armedWrong) return null;
    this.outClassFrames.set(pc, (this.outClassFrames.get(pc) ?? 0) + 1);
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
