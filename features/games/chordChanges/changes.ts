import { Chord, CHORDS } from '../../chords/data/chords';
import { isBarreChord } from '../chordQuiz/quiz';

/** How long a round of one-minute changes lasts. */
export const ROUND_SECONDS = 60;

/**
 * The classic "one minute changes" exercise: pick two chords, swap between
 * them for a minute, count how many clean changes you make. It is the single
 * most effective thing a beginner can drill, because the hard part of playing
 * chords is never holding one — it is arriving at the next one in time.
 */

/**
 * Storage key for a pair's best score. Order-independent, because Em to Am
 * and Am to Em are the same exercise.
 */
export function pairKey(a: string, b: string): string {
  return `chord-changes:${[a, b].sort().join('-')}`;
}

/** Pairs worth suggesting: common, useful, and a reasonable first target. */
export const SUGGESTED_PAIRS: [string, string][] = [
  ['Em', 'Am'],
  ['G', 'C'],
  ['C', 'D'],
  ['G', 'D'],
  ['Am', 'C'],
  ['D', 'A'],
  ['Em', 'G'],
  ['C', 'F'],
  ['Am', 'F'],
  ['A', 'E'],
];

/** Chords offered in the picker, easiest first so a beginner starts well. */
export function pickerChords(all: Chord[] = CHORDS): Chord[] {
  const open = all.filter((c) => !isBarreChord(c));
  const barre = all.filter((c) => isBarreChord(c));
  return [...open, ...barre];
}

/**
 * A rating for a minute's work, using the numbers guitar teachers actually
 * quote. Below 20 the change is still being assembled finger by finger; at
 * 60 it is one movement.
 */
export type ChangeRating = 'starting' | 'getting there' | 'solid' | 'fluent';

export function rateChanges(count: number): ChangeRating {
  if (count < 20) return 'starting';
  if (count < 40) return 'getting there';
  if (count < 60) return 'solid';
  return 'fluent';
}

/** Encouragement matched to the rating, without lying about the number. */
export function ratingBlurb(rating: ChangeRating): string {
  switch (rating) {
    case 'starting':
      return 'Every change still gets built finger by finger. That is normal - the count climbs fast at this stage.';
    case 'getting there':
      return 'The shape is arriving as a unit now. Keep the strumming hand moving even when the fretting hand is late.';
    case 'solid':
      return 'That is a usable change - fast enough to play songs at tempo without dropping a beat.';
    case 'fluent':
      return 'One movement, no thinking. Pick a harder pair.';
  }
}
