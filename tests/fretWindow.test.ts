import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CHORDS, getChord, Chord } from '../features/chords/data/chords';
import {
  chordFretWindow,
  DIAGRAM_FRET_COUNT,
} from '../features/chords/data/fretWindow';

const shape = (strings: number[]): Chord => ({
  name: 'test',
  type: 'major',
  strings,
  fingers: strings.map((f) => (f > 0 ? 1 : 0)),
});

test('open shapes sit at the nut', () => {
  const w = chordFretWindow(shape([0, 2, 2, 0, 0, 0])); // Em
  assert.deepEqual(w, { startFret: 1, showNut: true });
});

test('an all-open chord still sits at the nut', () => {
  assert.deepEqual(chordFretWindow(shape([0, 0, 0, 0, 0, 0])), {
    startFret: 1,
    showNut: true,
  });
});

test('a shape reaching exactly the last visible fret stays at the nut', () => {
  const w = chordFretWindow(shape([-1, 3, 5, 5, 4, 3])); // Cm
  assert.deepEqual(w, { startFret: 1, showNut: true });
});

test('a shape past the window slides up and drops the nut', () => {
  const w = chordFretWindow(shape([4, 6, 6, 5, 4, 4])); // Ab barre
  assert.deepEqual(w, { startFret: 4, showNut: false });
});

test('the window is anchored on the lowest fretted note', () => {
  const w = chordFretWindow(shape([-1, 6, 8, 8, 8, 6])); // Eb barre
  assert.equal(w.startFret, 6);
});

test('muted and open strings do not drag the window down', () => {
  const w = chordFretWindow(shape([-1, 0, 7, 9, 9, 7]));
  assert.equal(w.startFret, 7, 'the open A string should not anchor the window');
});

test('every chord in the library fits inside its own window', () => {
  for (const c of CHORDS as Chord[]) {
    const { startFret } = chordFretWindow(c);
    for (const fret of c.strings) {
      if (fret <= 0) continue;
      assert.ok(
        fret >= startFret && fret < startFret + DIAGRAM_FRET_COUNT,
        `${c.name}: fret ${fret} falls outside the window starting at ${startFret}`
      );
    }
  }
});

test('the barre shapes added up the neck really are up the neck', () => {
  for (const name of ['Ab', 'Eb', 'G#m', 'C#m']) {
    const c = getChord(name);
    if (!c) throw new Error(`${name} is missing from the library`);
    assert.equal(
      chordFretWindow(c).showNut,
      false,
      `${name} should render away from the nut`
    );
  }
});
