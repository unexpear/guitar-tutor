import { InstrumentId } from './instrumentProfiles';

export type GuitarType = 'acoustic' | 'electric';

export interface TuningPreset {
  /** Stable persisted key. Names are not unique across instruments. */
  id: string;
  name: string;
  instrumentId: InstrumentId;
  /** Retained for the existing guitar artwork and legacy preference mapping. */
  guitarType?: GuitarType;
  /** Individual targets in physical low-to-high/course order. */
  strings: string[];
  /** Paired target indices for multi-course instruments such as 12-string. */
  coursePairs?: readonly (readonly [number, number])[];
  /** The physical string order intentionally does not ascend in pitch. */
  reentrant?: boolean;
}

export const TUNING_PRESETS: TuningPreset[] = [
  {
    id: 'guitar-acoustic-standard',
    name: 'Standard E',
    instrumentId: 'guitar-acoustic',
    guitarType: 'acoustic',
    strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'guitar-acoustic-drop-d',
    name: 'Drop D',
    instrumentId: 'guitar-acoustic',
    guitarType: 'acoustic',
    strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'guitar-acoustic-open-g',
    name: 'Open G',
    instrumentId: 'guitar-acoustic',
    guitarType: 'acoustic',
    strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
  },
  {
    id: 'guitar-acoustic-open-d',
    name: 'Open D',
    instrumentId: 'guitar-acoustic',
    guitarType: 'acoustic',
    strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
  },
  {
    id: 'guitar-acoustic-open-c',
    name: 'Open C',
    instrumentId: 'guitar-acoustic',
    guitarType: 'acoustic',
    strings: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'],
  },
  {
    id: 'guitar-acoustic-open-e',
    name: 'Open E',
    instrumentId: 'guitar-acoustic',
    guitarType: 'acoustic',
    strings: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
  },
  {
    id: 'guitar-acoustic-dadgad',
    name: 'DADGAD',
    instrumentId: 'guitar-acoustic',
    guitarType: 'acoustic',
    strings: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
  },
  {
    id: 'guitar-acoustic-half-step-down',
    name: 'Half Step Down',
    instrumentId: 'guitar-acoustic',
    guitarType: 'acoustic',
    strings: ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'],
  },
  {
    id: 'guitar-electric-standard',
    name: 'Standard E',
    instrumentId: 'guitar-electric',
    guitarType: 'electric',
    strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'guitar-electric-drop-d',
    name: 'Drop D',
    instrumentId: 'guitar-electric',
    guitarType: 'electric',
    strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'guitar-electric-d-sharp',
    name: 'D# Tuning',
    instrumentId: 'guitar-electric',
    guitarType: 'electric',
    strings: ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'],
  },
  {
    id: 'guitar-electric-drop-c',
    name: 'Drop C',
    instrumentId: 'guitar-electric',
    guitarType: 'electric',
    strings: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'],
  },
  {
    id: 'guitar-electric-d-standard',
    name: 'D Standard',
    instrumentId: 'guitar-electric',
    guitarType: 'electric',
    strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'],
  },
  {
    id: 'guitar-electric-c-standard',
    name: 'C Standard',
    instrumentId: 'guitar-electric',
    guitarType: 'electric',
    strings: ['C2', 'F2', 'A#2', 'D#3', 'G3', 'C4'],
  },
  {
    id: 'guitar-electric-open-g',
    name: 'Open G',
    instrumentId: 'guitar-electric',
    guitarType: 'electric',
    strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
  },
  {
    id: 'guitar-electric-open-d',
    name: 'Open D',
    instrumentId: 'guitar-electric',
    guitarType: 'electric',
    strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
  },
  {
    id: 'guitar-classical-standard',
    name: 'Standard E',
    instrumentId: 'guitar-classical',
    strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'guitar-baritone-standard-b',
    name: 'Standard B',
    instrumentId: 'guitar-baritone',
    strings: ['B1', 'E2', 'A2', 'D3', 'F#3', 'B3'],
  },
  {
    id: 'guitar-7-standard-b',
    name: 'Standard B',
    instrumentId: 'guitar-7',
    strings: ['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'guitar-8-standard-f-sharp',
    name: 'Standard F#',
    instrumentId: 'guitar-8',
    strings: ['F#1', 'B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'guitar-12-standard',
    name: 'Standard E',
    instrumentId: 'guitar-12',
    strings: ['E2', 'E3', 'A2', 'A3', 'D3', 'D4', 'G3', 'G4', 'B3', 'B3', 'E4', 'E4'],
    coursePairs: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]],
  },
  {
    id: 'bass-4-standard',
    name: 'Standard E',
    instrumentId: 'bass-4',
    strings: ['E1', 'A1', 'D2', 'G2'],
  },
  {
    id: 'bass-4-drop-d',
    name: 'Drop D',
    instrumentId: 'bass-4',
    strings: ['D1', 'A1', 'D2', 'G2'],
  },
  {
    id: 'bass-4-half-step-down',
    name: 'Half Step Down',
    instrumentId: 'bass-4',
    strings: ['D#1', 'G#1', 'C#2', 'F#2'],
  },
  {
    id: 'bass-4-d-standard',
    name: 'D Standard',
    instrumentId: 'bass-4',
    strings: ['D1', 'G1', 'C2', 'F2'],
  },
  {
    id: 'bass-5-standard',
    name: 'Standard B',
    instrumentId: 'bass-5',
    strings: ['B0', 'E1', 'A1', 'D2', 'G2'],
  },
  {
    id: 'bass-6-standard',
    name: 'Standard B',
    instrumentId: 'bass-6',
    strings: ['B0', 'E1', 'A1', 'D2', 'G2', 'C3'],
  },
  {
    id: 'ukulele-high-g-standard',
    name: 'Standard High G',
    instrumentId: 'ukulele-standard',
    strings: ['G4', 'C4', 'E4', 'A4'],
    reentrant: true,
  },
  {
    id: 'ukulele-low-g-standard',
    name: 'Standard Low G',
    instrumentId: 'ukulele-standard',
    strings: ['G3', 'C4', 'E4', 'A4'],
  },
  {
    id: 'ukulele-baritone-standard',
    name: 'Standard D',
    instrumentId: 'ukulele-baritone',
    strings: ['D3', 'G3', 'B3', 'E4'],
  },
  { id: 'mandolin-standard', name: 'Standard G', instrumentId: 'mandolin', strings: ['G3', 'G3', 'D4', 'D4', 'A4', 'A4', 'E5', 'E5'], coursePairs: [[0, 1], [2, 3], [4, 5], [6, 7]] },
  { id: 'banjo-5-open-g', name: 'Open G', instrumentId: 'banjo-5', strings: ['G4', 'D3', 'G3', 'B3', 'D4'], reentrant: true },
  { id: 'violin-standard', name: 'Standard G', instrumentId: 'violin', strings: ['G3', 'D4', 'A4', 'E5'] },
  { id: 'viola-standard', name: 'Standard C', instrumentId: 'viola', strings: ['C3', 'G3', 'D4', 'A4'] },
  { id: 'cello-standard', name: 'Standard C', instrumentId: 'cello', strings: ['C2', 'G2', 'D3', 'A3'] },
  {
    id: 'chromatic',
    name: 'Chromatic',
    instrumentId: 'chromatic',
    strings: [],
  },
];

/**
 * Resolve a saved tuning name to the version for the player's instrument.
 * Classical guitars share the acoustic presets.
 */
export function findTuningPreset(
  idOrName: string,
  guitarType: GuitarType | 'classical',
): TuningPreset | undefined {
  const byId = TUNING_PRESETS.find((preset) => preset.id === idOrName);
  if (byId) return byId;
  const preferredType = guitarType === 'electric' ? 'electric' : 'acoustic';
  const preferredInstrument =
    guitarType === 'classical' ? 'guitar-classical' : `guitar-${preferredType}`;
  const matches = TUNING_PRESETS.filter(
    (preset) =>
      preset.name === idOrName && preset.instrumentId.startsWith('guitar-'),
  );
  return (
    matches.find((preset) => preset.instrumentId === preferredInstrument) ??
    matches.find((preset) => preset.guitarType === preferredType) ??
    matches[0]
  );
}

export function tuningPresetById(id: string): TuningPreset | undefined {
  return TUNING_PRESETS.find((preset) => preset.id === id);
}

/** Human string/course numbering for accessibility and guided tuning. */
export function tuningTargetLabel(
  tuning: TuningPreset,
  targetIndex: number,
): string {
  if (tuning.coursePairs) {
    const pairIndex = tuning.coursePairs.findIndex((pair) =>
      pair.includes(targetIndex),
    );
    if (pairIndex >= 0) {
      const courseNumber = tuning.coursePairs.length - pairIndex;
      const partner = tuning.coursePairs[pairIndex][1] === targetIndex;
      return `Course ${courseNumber}, ${partner ? 'paired' : 'main'} string`;
    }
  }
  return `String ${tuning.strings.length - targetIndex}`;
}

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const FLAT_TO_SHARP: Record<string, string> = {
  Cb: 'B', Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#',
};

export function noteToFrequency(note: string, referencePitchHz = 440): number {
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
  const a4 =
    Number.isFinite(referencePitchHz) && referencePitchHz > 0
      ? referencePitchHz
      : 440;
  return a4 * Math.pow(2, (midiNote - 69) / 12);
}

