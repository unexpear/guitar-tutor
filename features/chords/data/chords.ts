export type ChordType = 'major' | 'minor' | '7th' | 'minor7th' | 'major7th' | 'dim';

export interface Chord {
  name: string;
  type: ChordType;
  /** Fret per string, low E -> high e (index 0 = 6th string). -1 = muted, 0 = open. */
  strings: number[];
  /** Fretting finger per string (0 = none), same order. */
  fingers: number[];
}

export const CHORDS: Chord[] = [
  // Major
  { name: 'A', type: 'major', strings: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  { name: 'B', type: 'major', strings: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1] },
  { name: 'C', type: 'major', strings: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  { name: 'D', type: 'major', strings: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  { name: 'E', type: 'major', strings: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  { name: 'F', type: 'major', strings: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
  { name: 'G', type: 'major', strings: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },

  // Major barre shapes. These are the two movable forms: the E shape with its
  // root on the 6th string and the A shape with its root on the 5th. Slide
  // either one up the neck and the name changes with the root.
  { name: 'F#', type: 'major', strings: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] },
  { name: 'Ab', type: 'major', strings: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1] },
  { name: 'Bb', type: 'major', strings: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1] },
  { name: 'Eb', type: 'major', strings: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1] },

  // Minor
  { name: 'Am', type: 'minor', strings: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  { name: 'Bm', type: 'minor', strings: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] },
  { name: 'Cm', type: 'minor', strings: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] },
  { name: 'Dm', type: 'minor', strings: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  { name: 'Em', type: 'minor', strings: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  { name: 'Fm', type: 'minor', strings: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] },
  { name: 'Gm', type: 'minor', strings: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] },
  { name: 'F#m', type: 'minor', strings: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1] },
  { name: 'G#m', type: 'minor', strings: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1] },
  { name: 'C#m', type: 'minor', strings: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1] },

  // 7th
  { name: 'A7', type: '7th', strings: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  { name: 'B7', type: '7th', strings: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  { name: 'C7', type: '7th', strings: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  { name: 'D7', type: '7th', strings: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  { name: 'E7', type: '7th', strings: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  { name: 'G7', type: '7th', strings: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },

  // Minor 7th
  { name: 'Am7', type: 'minor7th', strings: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  { name: 'Dm7', type: 'minor7th', strings: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  { name: 'Em7', type: 'minor7th', strings: [0, 2, 2, 0, 3, 0], fingers: [0, 2, 3, 0, 4, 0] },

  // Major 7th
  { name: 'Cmaj7', type: 'major7th', strings: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  { name: 'Fmaj7', type: 'major7th', strings: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  { name: 'Gmaj7', type: 'major7th', strings: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3] },

  // Diminished
  { name: 'Adim', type: 'dim', strings: [-1, 0, 1, 2, 1, -1], fingers: [0, 0, 1, 3, 2, 0] },
  { name: 'Bdim', type: 'dim', strings: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0] },
  { name: 'Edim', type: 'dim', strings: [-1, -1, 2, 3, 5, 3], fingers: [0, 0, 1, 2, 4, 3] },
];

export function getChord(name: string): Chord | undefined {
  return CHORDS.find((c) => c.name === name);
}

// ---- Pitch math (standard tuning) ----

/** MIDI numbers of the open strings, low E -> high e. */
export const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midi: number): string {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** MIDI note sounded by a string/fret in standard tuning. */
export function stringFretToMidi(stringIndex: number, fret: number): number {
  return OPEN_STRING_MIDI[stringIndex] + fret;
}

/** MIDI numbers of every sounding string of a chord (muted strings skipped). */
export function chordMidiNotes(chord: Chord): number[] {
  const notes: number[] = [];
  chord.strings.forEach((fret, i) => {
    if (fret >= 0) notes.push(stringFretToMidi(i, fret));
  });
  return notes;
}

/** Pitch classes (0-11) present in a chord. */
export function chordPitchClasses(chord: Chord): Set<number> {
  return new Set(chordMidiNotes(chord).map((m) => ((m % 12) + 12) % 12));
}

/** MIDI of the lowest sounding (bass) string of a chord. */
export function chordBassMidi(chord: Chord): number {
  const notes = chordMidiNotes(chord);
  return Math.min(...notes);
}
