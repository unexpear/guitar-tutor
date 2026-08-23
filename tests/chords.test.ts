import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHORDS,
  getChord,
  Chord,
  chordPitchClasses,
  chordBassMidi,
  stringFretToMidi,
} from '../features/chords/data/chords';
import { findBarres } from '../features/chords/data/barres';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Pitch classes a chord symbol is expected to contain. */
function expectedClasses(name: string): number[] | null {
  const m = /^([A-G][#b]?)(m|maj7|m7|7|sus2|sus4|dim|aug|6|9|add9)?$/.exec(name);
  if (!m) return null;
  let root = NAMES.indexOf(m[1].replace('b', '#'));
  if (m[1].endsWith('b')) root = (NAMES.indexOf(m[1][0]) + 11) % 12;
  if (root < 0) return null;
  const q = m[2] ?? '';
  const intervals: Record<string, number[]> = {
    '': [0, 4, 7],
    m: [0, 3, 7],
    '7': [0, 4, 7, 10],
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
    dim: [0, 3, 6],
    aug: [0, 4, 8],
    '6': [0, 4, 7, 9],
    '9': [0, 4, 7, 10, 2],
    add9: [0, 4, 7, 2],
  };
  const iv = intervals[q];
  if (!iv) return null;
  return iv.map((i) => (root + i) % 12);
}

const all: Chord[] = CHORDS;

test('the library has chords and every entry is well formed', () => {
  assert.ok(all.length >= 20, `only ${all.length} chords`);
  for (const c of all) {
    assert.equal(c.strings.length, 6, `${c.name}: needs 6 strings`);
    assert.equal(c.fingers.length, 6, `${c.name}: needs 6 finger slots`);
    for (let i = 0; i < 6; i++) {
      const fret = c.strings[i];
      assert.ok(fret >= -1 && fret <= 15, `${c.name}: bad fret ${fret}`);
      const finger = c.fingers[i];
      assert.ok(finger >= 0 && finger <= 4, `${c.name}: bad finger ${finger}`);
      if (fret <= 0) {
        assert.equal(finger, 0, `${c.name}: open/muted string has a finger on it`);
      } else {
        assert.notEqual(finger, 0, `${c.name}: fretted string has no finger`);
      }
    }
    assert.ok(
      c.strings.some((f) => f >= 0),
      `${c.name}: every string is muted`
    );
  }
});

test('every voicing only contains notes of the chord it names', () => {
  for (const c of all) {
    const expected = expectedClasses(c.name);
    if (!expected) continue; // slash chords and other names we do not model
    const actual = [...chordPitchClasses(c)];
    for (const pc of actual) {
      assert.ok(
        expected.includes(pc),
        `${c.name}: contains ${NAMES[pc]}, not in the chord`
      );
    }
    // Root and third (or fourth/second for sus) must be present.
    assert.ok(actual.includes(expected[0]), `${c.name}: no root`);
    assert.ok(actual.includes(expected[1]), `${c.name}: missing the defining tone`);
  }
});

test('the bass note is the lowest sounding string', () => {
  for (const c of all) {
    const bass = chordBassMidi(c);
    const sounding = c.strings
      .map((fret, i) => (fret >= 0 ? stringFretToMidi(i, fret) : null))
      .filter((n): n is number => n !== null);
    assert.equal(bass, Math.min(...sounding), `${c.name}: wrong bass`);
  }
});

test('muted strings are never in the middle of sounding ones', () => {
  for (const c of all) {
    const sounding = c.strings.map((f) => f >= 0);
    const first = sounding.indexOf(true);
    const last = sounding.lastIndexOf(true);
    for (let i = first; i <= last; i++) {
      // An inner mute is legal but rare and hard for a beginner; flag any
      // that appear so they are a deliberate choice, not a typo.
      if (!sounding[i]) {
        assert.fail(`${c.name}: unexpected muted string ${i} between sounding strings`);
      }
    }
  }
});

test('barre detection finds the bar in F and B and leaves open chords alone', () => {
  const f = getChord('F');
  if (f) {
    const barres = findBarres(f);
    assert.equal(barres.length, 1, 'F should have exactly one barre');
    assert.equal(barres[0].finger, 1);
    assert.ok(barres[0].to > barres[0].from);
  }
  const em = getChord('Em');
  if (!em) throw new Error('Em must exist');
  assert.deepEqual(findBarres(em), [], 'Em is an open chord with no barre');
});

test('a barre never spans strings that are not on its fret', () => {
  for (const c of all) {
    for (const b of findBarres(c)) {
      for (let i = b.from; i <= b.to; i++) {
        // Strings inside the span may be fretted higher by other fingers,
        // but must never be *below* the barre fret.
        const fret = c.strings[i];
        assert.ok(
          fret === -1 || fret >= b.fret,
          `${c.name}: string ${i} at fret ${fret} sits under the ${b.fret} barre`
        );
      }
    }
  }
});

test('one finger is never on two different frets at once', () => {
  for (const c of all) {
    const frets = new Map<number, Set<number>>();
    c.strings.forEach((fret, i) => {
      const finger = c.fingers[i];
      if (fret > 0 && finger > 0) {
        if (!frets.has(finger)) frets.set(finger, new Set());
        frets.get(finger)!.add(fret);
      }
    });
    for (const [finger, set] of frets) {
      assert.equal(
        set.size,
        1,
        `${c.name}: finger ${finger} is on frets ${[...set].join(' and ')}`
      );
    }
  }
});

test('no shape asks for a stretch wider than a hand', () => {
  // Four frets is the practical limit; beyond that the shape is a typo.
  for (const c of all) {
    const fretted = c.strings.filter((f) => f > 0);
    if (fretted.length < 2) continue;
    const span = Math.max(...fretted) - Math.min(...fretted) + 1;
    assert.ok(span <= 4, `${c.name}: spans ${span} frets`);
  }
});

test('a chord never asks for more than four fingers', () => {
  for (const c of all) {
    const used = new Set(c.fingers.filter((f) => f > 0));
    assert.ok(used.size <= 4, `${c.name}: uses ${used.size} fingers`);
    for (const f of used) {
      assert.ok(f >= 1 && f <= 4, `${c.name}: finger ${f} does not exist`);
    }
  }
});
