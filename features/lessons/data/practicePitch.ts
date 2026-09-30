import type { InstrumentId } from '../../tuner/data/instrumentProfiles';
import { OPEN_STRING_MIDI } from '../../chords/data/chords';

/**
 * Sounding open-string MIDI for lesson pitch checks.
 * Index 0 is the string nearest the player’s face, matching each instrument’s
 * usual tab, except violin-family where index 0 is the lowest string and the
 * tab draws the highest string on top.
 * Pitch only: this does not describe bow direction, a mute, or which finger rolled.
 */
export type PracticeInstrument =
  | 'guitar'
  | 'bass'
  | 'ukulele'
  | 'mandolin'
  | 'banjo'
  | 'violin'
  | 'viola'
  | 'cello';

export interface PracticePitch {
  profileId: InstrumentId;
  /** Sounding MIDI of each open string or course, index 0 first. */
  openMidi: readonly number[];
  /** Tab labels in index order. */
  labels: readonly string[];
  /** Ukulele and banjo draw index 0 on the top row. Others draw the last index on top. */
  index0OnTop: boolean;
}

const PITCH: Record<PracticeInstrument, PracticePitch> = {
  guitar: {
    profileId: 'guitar-acoustic',
    openMidi: OPEN_STRING_MIDI,
    labels: ['E', 'A', 'D', 'G', 'B', 'e'],
    index0OnTop: false,
  },
  bass: {
    profileId: 'bass-4',
    openMidi: [28, 33, 38, 43],
    labels: ['E', 'A', 'D', 'G'],
    index0OnTop: false,
  },
  // Re-entrant high G. G C E A from the face downward.
  ukulele: {
    profileId: 'ukulele-standard',
    openMidi: [67, 60, 64, 69],
    labels: ['G', 'C', 'E', 'A'],
    index0OnTop: true,
  },
  // Courses in fifths. Both strings of a course share one pitch.
  mandolin: {
    profileId: 'mandolin',
    openMidi: [55, 62, 69, 76],
    labels: ['G', 'D', 'A', 'E'],
    index0OnTop: false,
  },
  // 1st string (nearest the floor) on top; short 5th string on the bottom.
  banjo: {
    profileId: 'banjo-5',
    openMidi: [67, 50, 55, 59, 62],
    labels: ['g', 'D', 'G', 'B', 'D'],
    index0OnTop: false,
  },
  violin: {
    profileId: 'violin',
    openMidi: [55, 62, 69, 76],
    labels: ['G', 'D', 'A', 'E'],
    index0OnTop: false,
  },
  viola: {
    profileId: 'viola',
    openMidi: [48, 55, 62, 69],
    labels: ['C', 'G', 'D', 'A'],
    index0OnTop: false,
  },
  cello: {
    profileId: 'cello',
    openMidi: [36, 43, 50, 57],
    labels: ['C', 'G', 'D', 'A'],
    index0OnTop: false,
  },
};

export function practicePitch(instrument?: 'bass' | PracticeInstrument): PracticePitch {
  if (instrument === 'bass') return PITCH.bass;
  if (instrument && instrument in PITCH) return PITCH[instrument];
  return PITCH.guitar;
}

export function tabRows(instrument?: 'bass' | PracticeInstrument): { label: string; stringIndex: number }[] {
  const spec = practicePitch(instrument);
  const rows = spec.labels.map((label, stringIndex) => ({ label, stringIndex }));
  return spec.index0OnTop ? rows : rows.reverse();
}

/** High-G ukulele C: open G, C, E, and A at fret 3. */
export const UKULELE_C_MIDI = [67, 60, 64, 72] as const;
/** High-G ukulele G7: G open, C fret 2, E fret 1, A fret 2. */
export const UKULELE_G7_MIDI = [67, 62, 65, 71] as const;

/** Fret on each open string for these sounding pitches. Null if that string is not in the voicing. */
export function fretsFromSounding(openMidi: readonly number[], sounding: readonly number[]): (number | null)[] {
  const used = new Set<number>();
  return openMidi.map((open) => {
    for (let fret = 0; fret <= 12; fret += 1) {
      const at = sounding.findIndex((midi, index) => midi === open + fret && !used.has(index));
      if (at >= 0) {
        used.add(at);
        return fret;
      }
    }
    return null;
  });
}

/** Bow, ukulele, mandolin, and banjo fundamentals are clear enough that an octave higher is a different note. */
export function practiceAllowsOctaveUp(instrument?: 'bass' | PracticeInstrument): boolean {
  const id = practicePitch(instrument).profileId;
  return id === 'guitar-acoustic' || id === 'bass-4' || id === 'cello';
}
