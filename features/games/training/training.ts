const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const OPEN_MIDI = [40, 45, 50, 55, 59, 64] as const;

export const INTERVALS = [
  { semitones: 0, name: 'Unison' },
  { semitones: 3, name: 'Minor 3rd' },
  { semitones: 4, name: 'Major 3rd' },
  { semitones: 5, name: 'Perfect 4th' },
  { semitones: 7, name: 'Perfect 5th' },
  { semitones: 12, name: 'Octave' },
] as const;

export function noteNameFromMidi(midi: number): string {
  return `${PITCHES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function fretboardNote(stringIndex: number, fret: number): string {
  if (!Number.isInteger(stringIndex) || stringIndex < 0 || stringIndex >= OPEN_MIDI.length) throw new Error('Invalid string.');
  if (!Number.isInteger(fret) || fret < 0 || fret > 24) throw new Error('Invalid fret.');
  return PITCHES[(OPEN_MIDI[stringIndex] + fret) % 12];
}

export function rhythmAccuracy(taps: number[], beatMs: number): number {
  if (taps.length < 2 || beatMs <= 0) return 0;
  const errors = taps.slice(1).map((tap, index) => Math.abs((tap - taps[index]) - beatMs));
  const meanError = errors.reduce((sum, value) => sum + value, 0) / errors.length;
  return Math.max(0, Math.round(100 * (1 - meanError / beatMs)));
}
