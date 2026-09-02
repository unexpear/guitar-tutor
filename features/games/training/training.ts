const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const OPEN_MIDI = [40, 45, 50, 55, 59, 64] as const;
export type TrainingDifficulty = 'guided' | 'challenge';

export const TRAINING_ROUND_LENGTH: Record<TrainingDifficulty, number> = {
  guided: 6,
  challenge: 10,
};

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

export function earQuestion(seed: number, round: number, difficulty: TrainingDifficulty) {
  const pool = difficulty === 'guided'
    ? INTERVALS.filter((item) => ['Unison', 'Major 3rd', 'Perfect 5th', 'Octave'].includes(item.name))
    : [...INTERVALS];
  const answerIndex = Math.abs(Math.floor(seed * 10_000) + round * 5) % pool.length;
  const answer = pool[answerIndex];
  const rootMidi = 48 + (Math.abs(Math.floor(seed * 100) + round * 3) % 8);
  const remaining = pool.filter((item) => item.name !== answer.name);
  const optionCount = Math.min(difficulty === 'guided' ? 3 : 4, pool.length);
  return {
    answer,
    notes: [noteNameFromMidi(rootMidi), noteNameFromMidi(rootMidi + answer.semitones)],
    options: [answer, ...remaining].slice(0, optionCount).sort((a, b) => a.semitones - b.semitones),
  };
}

const GUIDED_FRETS = [0, 3, 5, 7, 12] as const;

export function fretQuestion(seed: number, round: number, difficulty: TrainingDifficulty) {
  const stringIndex = Math.abs(Math.floor(seed * 10_000) + round * 5) % 6;
  const fretNumber = difficulty === 'guided'
    ? GUIDED_FRETS[Math.abs(Math.floor(seed * 1000) + round * 3) % GUIDED_FRETS.length]
    : Math.abs(Math.floor(seed * 1000) + round * 7) % 13;
  const answer = fretboardNote(stringIndex, fretNumber);
  const optionCount = difficulty === 'guided' ? 3 : 4;
  const options = [answer];
  let offset = 1;
  while (options.length < optionCount) {
    const answerIndex = PITCHES.indexOf(answer as typeof PITCHES[number]);
    const candidate = PITCHES[(answerIndex + offset * 2) % PITCHES.length];
    if (!options.includes(candidate)) options.push(candidate);
    offset += 1;
  }
  return { stringIndex, fretNumber, answer, options: options.sort() };
}

export function intervalHint(semitones: number): string {
  if (semitones === 0) return 'Unison repeats the same pitch.';
  if (semitones === 12) return 'An octave sounds like the same note, only higher.';
  return `${semitones} frets apart. Listen for the size of the jump, not the starting note.`;
}
