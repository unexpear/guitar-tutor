import { Chord } from './chords';

export interface Barre {
  finger: number;
  fret: number;
  from: number; // lowest string index
  to: number;   // highest string index
}

/**
 * A bar: one finger flattened across several strings at the same fret.
 * Kept separate from the diagram component so it can be unit tested and
 * reused by anything that needs to know a chord is barred.
 */
export function findBarres(chord: Chord): Barre[] {
  const groups = new Map<string, number[]>();
  chord.strings.forEach((fret, i) => {
    const finger = chord.fingers[i];
    if (fret > 0 && finger > 0) {
      const key = `${finger}:${fret}`;
      groups.set(key, [...(groups.get(key) ?? []), i]);
    }
  });
  const barres: Barre[] = [];
  groups.forEach((idx, key) => {
    if (idx.length < 2) return;
    const [finger, fret] = key.split(':').map(Number);
    barres.push({ finger, fret, from: Math.min(...idx), to: Math.max(...idx) });
  });
  return barres;
}
