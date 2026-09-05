/**
 * Guitar reference samples, generated from scripts/generate-samples.js.
 *
 * Metro requires every bundled asset path to be statically discoverable, so
 * each require must contain a string literal. Keep this registry explicit even
 * though the filenames follow a predictable pattern.
 */

import { referenceSampleMapping } from '../referenceSampleMapping';

const ASSETS: Record<string, number | string> = {
  B0: require('../../../assets/audio/B0.wav'),
  C1: require('../../../assets/audio/C1.wav'),
  'C#1': require('../../../assets/audio/C#1.wav'),
  D1: require('../../../assets/audio/D1.wav'),
  'D#1': require('../../../assets/audio/D#1.wav'),
  E1: require('../../../assets/audio/E1.wav'),
  F1: require('../../../assets/audio/F1.wav'),
  'F#1': require('../../../assets/audio/F#1.wav'),
  G1: require('../../../assets/audio/G1.wav'),
  'G#1': require('../../../assets/audio/G#1.wav'),
  A1: require('../../../assets/audio/A1.wav'),
  'A#1': require('../../../assets/audio/A#1.wav'),
  B1: require('../../../assets/audio/B1.wav'),
  C2: require('../../../assets/audio/C2.wav'),
  'C#2': require('../../../assets/audio/C#2.wav'),
  D2: require('../../../assets/audio/D2.wav'),
  'D#2': require('../../../assets/audio/D#2.wav'),
  E2: require('../../../assets/audio/E2.wav'),
  F2: require('../../../assets/audio/F2.wav'),
  'F#2': require('../../../assets/audio/F#2.wav'),
  G2: require('../../../assets/audio/G2.wav'),
  'G#2': require('../../../assets/audio/G#2.wav'),
  A2: require('../../../assets/audio/A2.wav'),
  'A#2': require('../../../assets/audio/A#2.wav'),
  B2: require('../../../assets/audio/B2.wav'),
  C3: require('../../../assets/audio/C3.wav'),
  'C#3': require('../../../assets/audio/C#3.wav'),
  D3: require('../../../assets/audio/D3.wav'),
  'D#3': require('../../../assets/audio/D#3.wav'),
  E3: require('../../../assets/audio/E3.wav'),
  F3: require('../../../assets/audio/F3.wav'),
  'F#3': require('../../../assets/audio/F#3.wav'),
  G3: require('../../../assets/audio/G3.wav'),
  'G#3': require('../../../assets/audio/G#3.wav'),
  A3: require('../../../assets/audio/A3.wav'),
  'A#3': require('../../../assets/audio/A#3.wav'),
  B3: require('../../../assets/audio/B3.wav'),
  C4: require('../../../assets/audio/C4.wav'),
  'C#4': require('../../../assets/audio/C#4.wav'),
  D4: require('../../../assets/audio/D4.wav'),
  'D#4': require('../../../assets/audio/D#4.wav'),
  E4: require('../../../assets/audio/E4.wav'),
  F4: require('../../../assets/audio/F4.wav'),
  'F#4': require('../../../assets/audio/F#4.wav'),
  G4: require('../../../assets/audio/G4.wav'),
  'G#4': require('../../../assets/audio/G#4.wav'),
  A4: require('../../../assets/audio/A4.wav'),
  'A#4': require('../../../assets/audio/A#4.wav'),
  B4: require('../../../assets/audio/B4.wav'),
  C5: require('../../../assets/audio/C5.wav'),
  'C#5': require('../../../assets/audio/C#5.wav'),
  D5: require('../../../assets/audio/D5.wav'),
  'D#5': require('../../../assets/audio/D#5.wav'),
  E5: require('../../../assets/audio/E5.wav'),
  F5: require('../../../assets/audio/F5.wav'),
  'F#5': require('../../../assets/audio/F#5.wav'),
  G5: require('../../../assets/audio/G5.wav'),
  'G#5': require('../../../assets/audio/G#5.wav'),
  A5: require('../../../assets/audio/A5.wav'),
  'A#5': require('../../../assets/audio/A#5.wav'),
  B5: require('../../../assets/audio/B5.wav'),
  C6: require('../../../assets/audio/C6.wav'),
  'C#6': require('../../../assets/audio/C#6.wav'),
  D6: require('../../../assets/audio/D6.wav'),
  'D#6': require('../../../assets/audio/D#6.wav'),
  E6: require('../../../assets/audio/E6.wav'),
};

/** The note names this app can actually produce sound for. */
export const SAMPLE_NOTES: string[] = Object.keys(ASSETS);

/** The bundled asset for a note, or null when no sample exists. */
export function sampleForNote(note: string): number | string | null {
  return ASSETS[note] ?? null;
}

export function referenceSample(note: string): { asset: number | string; rate: number } | null {
  const mapped = referenceSampleMapping(note);
  const asset = mapped ? sampleForNote(mapped.note) : null;
  return mapped && asset !== null ? { asset, rate:mapped.rate } : null;
}
