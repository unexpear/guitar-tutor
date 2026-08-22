export type GuitarType = 'acoustic' | 'electric';

export interface TuningPreset {
  name: string;
  guitarType: GuitarType;
  strings: string[];
}

export const TUNING_PRESETS: TuningPreset[] = [
  {
    name: 'Standard E',
    guitarType: 'acoustic',
    strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    name: 'Drop D',
    guitarType: 'acoustic',
    strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    name: 'Open G',
    guitarType: 'acoustic',
    strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
  },
  {
    name: 'Open D',
    guitarType: 'acoustic',
    strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
  },
  {
    name: 'Open C',
    guitarType: 'acoustic',
    strings: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'],
  },
  {
    name: 'Open E',
    guitarType: 'acoustic',
    strings: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
  },
  {
    name: 'DADGAD',
    guitarType: 'acoustic',
    strings: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
  },
  {
    name: 'Half Step Down',
    guitarType: 'acoustic',
    strings: ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'],
  },
  {
    name: 'Standard E',
    guitarType: 'electric',
    strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    name: 'Drop D',
    guitarType: 'electric',
    strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    name: 'D# Tuning',
    guitarType: 'electric',
    strings: ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'],
  },
  {
    name: 'Drop C',
    guitarType: 'electric',
    strings: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'],
  },
  {
    name: 'D Standard',
    guitarType: 'electric',
    strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'],
  },
  {
    name: 'C Standard',
    guitarType: 'electric',
    strings: ['C2', 'F2', 'A#2', 'D#3', 'G3', 'C4'],
  },
  {
    name: 'Open G',
    guitarType: 'electric',
    strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
  },
  {
    name: 'Open D',
    guitarType: 'electric',
    strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
  },
];

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const FLAT_TO_SHARP: Record<string, string> = {
  Cb: 'B', Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#',
};

export function noteToFrequency(note: string): number {
  const match = note.match(/^([A-G][#b]?)(\d)$/);
  if (!match) return 0;
  const [, rawPitch, octaveStr] = match;
  const pitch = FLAT_TO_SHARP[rawPitch] ?? rawPitch;
  const octave = parseInt(octaveStr, 10);
  const noteIndex = NOTE_NAMES.indexOf(pitch);
  if (noteIndex === -1) return 0;
  // Flats one semitone below C (e.g. Cb4) belong to the octave below.
  const octaveAdjust = rawPitch === 'Cb' ? -1 : 0;
  const midiNote = (octave + octaveAdjust + 1) * 12 + noteIndex;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function frequencyToNote(frequency: number): { note: string; cents: number } {
  if (frequency <= 0) return { note: '--', cents: 0 };
  const midiNote = 69 + 12 * Math.log2(frequency / 440);
  const roundedMidi = Math.round(midiNote);
  const cents = Math.round((midiNote - roundedMidi) * 100);
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  return { note: NOTE_NAMES[noteIndex] + octave, cents };
}
