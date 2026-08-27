import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TUNING_PRESETS,
  noteToFrequency,
  NOTE_NAMES,
} from '../features/tuner/data/tunings';

function closeTo(actual: number, expected: number, tol = 0.005) {
  const rel = Math.abs(actual - expected) / expected;
  assert.ok(
    rel <= tol,
    `${actual} not within ${tol * 100}% of ${expected}`
  );
}

test('noteToFrequency anchors A4 at 440 Hz', () => {
  assert.equal(noteToFrequency('A4'), 440);
});

test('noteToFrequency nails the open strings of standard tuning', () => {
  closeTo(noteToFrequency('E2'), 82.4069);
  closeTo(noteToFrequency('A2'), 110.0);
  closeTo(noteToFrequency('D3'), 146.8324);
  closeTo(noteToFrequency('G3'), 195.9977);
  closeTo(noteToFrequency('B3'), 246.9417);
  closeTo(noteToFrequency('E4'), 329.6276);
});

test('an octave doubles the frequency', () => {
  closeTo(noteToFrequency('A3'), 220);
  closeTo(noteToFrequency('A5'), 880);
});

test('flat spellings land on the same pitch as their sharp equivalents', () => {
  const pairs: Array<[string, string]> = [
    ['Bb3', 'A#3'],
    ['Db4', 'C#4'],
    ['Eb4', 'D#4'],
    ['Gb4', 'F#4'],
    ['Ab4', 'G#4'],
  ];
  for (const [flat, sharp] of pairs) {
    assert.equal(
      noteToFrequency(flat),
      noteToFrequency(sharp),
      `${flat} should equal ${sharp}`
    );
  }
});

test('double-flat edge cases wrap to the note an octave below', () => {
  // Cb4 is enharmonically B3; Fb4 is enharmonically E4.
  closeTo(noteToFrequency('Cb4'), noteToFrequency('B3'));
  closeTo(noteToFrequency('Fb4'), noteToFrequency('E4'));
});

test('garbage input returns 0 instead of NaN or nonsense', () => {
  for (const bad of ['H4', 'A', '', 'A10', '4A', 'a4', '#4', '-1']) {
    assert.equal(noteToFrequency(bad), 0, `expected 0 for "${bad}"`);
  }
});

test('there are sixteen presets covering both guitar families', () => {
  assert.equal(TUNING_PRESETS.length, 16);
  const acoustic = TUNING_PRESETS.filter((p) => p.guitarType === 'acoustic');
  const electric = TUNING_PRESETS.filter((p) => p.guitarType === 'electric');
  assert.equal(acoustic.length, 8);
  assert.equal(electric.length, 8);
});

test('every preset has exactly six strings', () => {
  for (const p of TUNING_PRESETS) {
    assert.equal(p.strings.length, 6, `${p.name}: ${p.strings.length} strings`);
    assert.ok(p.name.trim(), 'a preset has no name');
  }
});

test('strings within a preset ascend in pitch from low to high', () => {
  for (const p of TUNING_PRESETS) {
    const freqs = p.strings.map((n) => noteToFrequency(n));
    for (let i = 1; i < freqs.length; i++) {
      assert.ok(
        freqs[i] > freqs[i - 1],
        `${p.name}: string ${i} is not higher than string ${i - 1}`
      );
    }
  }
});

test('no string within a preset repeats another', () => {
  for (const p of TUNING_PRESETS) {
    const freqs = p.strings.map((n) => noteToFrequency(n));
    assert.equal(
      new Set(freqs).size,
      6,
      `${p.name}: two strings share a pitch`
    );
  }
});

test('every string label is a sharp spelling of a real note', () => {
  for (const p of TUNING_PRESETS) {
    for (const s of p.strings) {
      assert.ok(!s.includes('b'), `${p.name}: "${s}" uses a flat spelling`);
      const m = /^([A-G]#?)(\d)$/.exec(s);
      assert.ok(m, `${p.name}: "${s}" is not a valid note`);
      assert.ok(
        NOTE_NAMES.includes(m[1]),
        `${p.name}: "${s}" has an unknown pitch class`
      );
    }
  }
});

test('presets are unique within a guitar family', () => {
  const seen = new Set<string>();
  for (const p of TUNING_PRESETS) {
    const key = `${p.guitarType}:${p.name}`;
    assert.ok(!seen.has(key), `duplicate preset ${key}`);
    seen.add(key);
  }
});

test('every open-string frequency sits in the playable guitar range', () => {
  for (const p of TUNING_PRESETS) {
    for (const s of p.strings) {
      const f = noteToFrequency(s);
      assert.ok(f >= 55, `${p.name}: ${s} at ${f} Hz is below the low C`);
      assert.ok(f <= 700, `${p.name}: ${s} at ${f} Hz is absurdly high`);
    }
  }
});

test('drop tunings really drop the sixth string a full step', () => {
  const dropD = TUNING_PRESETS.find((p) => p.name === 'Drop D' && p.guitarType === 'acoustic');
  const standard = TUNING_PRESETS.find((p) => p.name === 'Standard E' && p.guitarType === 'acoustic');
  assert.ok(dropD && standard, 'standard and drop D acoustic presets exist');
  closeTo(noteToFrequency(dropD.strings[0]), noteToFrequency(standard.strings[0]) / Math.pow(2, 2 / 12));
  // The rest of the strings are identical to standard.
  for (let i = 1; i < 6; i++) {
    assert.equal(dropD.strings[i], standard.strings[i]);
  }
});

test('open tunings actually spell their chord', () => {
  const openG = TUNING_PRESETS.find((p) => p.name === 'Open G' && p.guitarType === 'acoustic');
  assert.ok(openG);
  // D G D G B D
  assert.deepEqual(openG.strings, ['D2', 'G2', 'D3', 'G3', 'B3', 'D4']);
  const classes = openG.strings.map((s) => noteToFrequency(s)).map((f) => {
    // NOTE_NAMES index of the nearest note below/at the frequency.
    const noteIndex = Math.round(12 * Math.log2(f / 440)) + 9;
    return ((noteIndex % 12) + 12) % 12;
  });
  // G major = G(7) B(11) D(2)
  for (const pc of classes) {
    assert.ok([7, 11, 2].includes(pc), `Open G contains pitch class ${pc}`);
  }
});