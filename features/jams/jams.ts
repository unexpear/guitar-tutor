export interface JamTrack {
  id: string;
  name: string;
  key: string;
  bpm: number;
  /** One guitar chord per bar, in 4/4. Original changes, not a song. */
  bars: readonly string[];
  /** Notes that fit the whole loop. */
  scale: readonly string[];
  hint: string;
}

export const JAM_TRACKS: readonly JamTrack[] = [
  {
    id: 'g-major',
    name: 'G major',
    key: 'G',
    bpm: 90,
    bars: ['G', 'Em', 'C', 'D'],
    scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    hint: 'Major scale. These notes fit every bar.',
  },
  {
    id: 'a-minor',
    name: 'A minor',
    key: 'Am',
    bpm: 80,
    bars: ['Am', 'G', 'F', 'E'],
    scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    hint: 'Natural minor. Stay on these notes over the loop.',
  },
  {
    id: 'c-major',
    name: 'C major',
    key: 'C',
    bpm: 100,
    bars: ['C', 'G', 'Am', 'F'],
    scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    hint: 'Major scale. One chord per bar.',
  },
  {
    id: 'd-major',
    name: 'D major',
    key: 'D',
    bpm: 96,
    bars: ['D', 'A', 'Bm', 'G'],
    scale: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    hint: 'Major scale.',
  },
  {
    id: 'e-blues',
    name: 'E blues',
    key: 'E',
    bpm: 76,
    bars: ['E7', 'A7', 'E7', 'B7'],
    scale: ['E', 'G', 'A', 'Bb', 'B', 'D'],
    hint: 'Minor pentatonic plus the flat five.',
  },
];

export function jamChordAt(jam: JamTrack, barIndex: number): string {
  const count = jam.bars.length;
  const index = ((barIndex % count) + count) % count;
  return jam.bars[index];
}
