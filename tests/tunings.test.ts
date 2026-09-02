import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TUNING_PRESETS,
  findTuningPreset,
  tuningTargetLabel,
  noteToFrequency,
  NOTE_NAMES,
} from '../features/tuner/data/tunings';
import {
  INSTRUMENT_PROFILES,
  guitarPracticeEngineOptions,
  instrumentProfile,
} from '../features/tuner/data/instrumentProfiles';

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

test('the catalogue covers guitars, basses, folk, orchestral, ukulele and chromatic tuning', () => {
  assert.equal(TUNING_PRESETS.length, 36);
  const acoustic = TUNING_PRESETS.filter((p) => p.guitarType === 'acoustic');
  const electric = TUNING_PRESETS.filter((p) => p.guitarType === 'electric');
  assert.equal(acoustic.length, 8);
  assert.equal(electric.length, 8);
  assert.ok(TUNING_PRESETS.some((p) => p.instrumentId.startsWith('bass-')));
  assert.ok(TUNING_PRESETS.some((p) => p.instrumentId.startsWith('ukulele-')));
  assert.ok(TUNING_PRESETS.some((p) => p.instrumentId === 'mandolin'));
  assert.ok(TUNING_PRESETS.some((p) => p.instrumentId === 'banjo-5'));
  assert.ok(TUNING_PRESETS.some((p) => p.instrumentId === 'violin'));
  assert.ok(TUNING_PRESETS.some((p) => p.instrumentId === 'viola'));
  assert.ok(TUNING_PRESETS.some((p) => p.instrumentId === 'cello'));
  assert.ok(TUNING_PRESETS.some((p) => p.instrumentId === 'chromatic'));
});

test('saved tuning resolution follows the selected guitar family', () => {
  assert.equal(findTuningPreset('Standard E', 'acoustic')?.guitarType, 'acoustic');
  assert.equal(findTuningPreset('Standard E', 'electric')?.guitarType, 'electric');
  assert.equal(findTuningPreset('Standard E', 'classical')?.instrumentId, 'guitar-classical');
  assert.equal(findTuningPreset('Drop D', 'electric')?.guitarType, 'electric');
  assert.equal(findTuningPreset('bass-4-standard', 'acoustic')?.instrumentId, 'bass-4');
});

test('saved tuning resolution falls back safely for family-specific presets', () => {
  assert.equal(findTuningPreset('Drop C', 'acoustic')?.guitarType, 'electric');
  assert.equal(findTuningPreset('Open C', 'electric')?.guitarType, 'acoustic');
  assert.equal(findTuningPreset('Not a tuning', 'electric'), undefined);
});

test('every instrument preset has a supported target count', () => {
  for (const p of TUNING_PRESETS) {
    if (p.instrumentId === 'chromatic') {
      assert.equal(p.strings.length, 0);
    } else {
      assert.ok(
        p.strings.length >= 4 && p.strings.length <= 12,
        `${p.id}: ${p.strings.length} targets`,
      );
    }
    assert.ok(p.name.trim(), 'a preset has no name');
  }
});

test('single-course linear instruments ascend in pitch from low to high', () => {
  for (const p of TUNING_PRESETS) {
    if (
      p.instrumentId === 'chromatic' ||
      p.reentrant ||
      p.coursePairs
    ) continue;
    const freqs = p.strings.map((n) => noteToFrequency(n));
    for (let i = 1; i < freqs.length; i++) {
      assert.ok(
        freqs[i] > freqs[i - 1],
        `${p.name}: string ${i} is not higher than string ${i - 1}`
      );
    }
  }
});

test('only declared paired courses may repeat an exact pitch', () => {
  for (const p of TUNING_PRESETS) {
    if (p.instrumentId === 'chromatic') continue;
    const freqs = p.strings.map((n) => noteToFrequency(n));
    const pairedIndexes = new Set(p.coursePairs?.flat() ?? []);
    freqs.forEach((frequency, index) => {
      const first = freqs.findIndex((candidate) => candidate === frequency);
      if (first !== index) {
        assert.ok(pairedIndexes.has(index), `${p.id}: undeclared duplicate target`);
      }
    });
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

test('preset ids and names within an instrument are unique', () => {
  const ids = new Set<string>();
  const seen = new Set<string>();
  for (const p of TUNING_PRESETS) {
    assert.ok(!ids.has(p.id), `duplicate preset id ${p.id}`);
    ids.add(p.id);
    const key = `${p.instrumentId}:${p.name}`;
    assert.ok(!seen.has(key), `duplicate preset ${key}`);
    seen.add(key);
  }
});

test('every target sits inside its explicit detector profile', () => {
  for (const p of TUNING_PRESETS) {
    const engine = instrumentProfile(p.instrumentId).engine;
    for (const s of p.strings) {
      const f = noteToFrequency(s);
      assert.ok(f >= (engine.minFrequency ?? 0), `${p.id}: ${s} below detector range`);
      assert.ok(f <= (engine.maxFrequency ?? Infinity), `${p.id}: ${s} above detector range`);
    }
  }
});

test('every tuning references a real, uniquely keyed instrument profile', () => {
  for (const tuning of TUNING_PRESETS) {
    assert.equal(instrumentProfile(tuning.instrumentId).id, tuning.instrumentId);
  }
  assert.equal(
    new Set(INSTRUMENT_PROFILES.map((profile) => profile.id)).size,
    INSTRUMENT_PROFILES.length,
  );
});

test('guitar practice uses the full guitar range and current calibration', () => {
  const options = guitarPracticeEngineOptions(442);
  assert.equal(options.a4, 442);
  assert.equal(options.minFrequency, 55);
  assert.equal(options.maxFrequency, 1400);
  assert.equal('instrument' in options, false);
});

test('the twelve-string layout declares six complete paired courses', () => {
  const twelve = TUNING_PRESETS.find((p) => p.id === 'guitar-12-standard');
  assert.ok(twelve?.coursePairs);
  assert.equal(twelve.coursePairs.length, 6);
  assert.deepEqual(
    [...new Set(twelve.coursePairs.flat())].sort((a, b) => a - b),
    Array.from({ length: 12 }, (_, index) => index),
  );
  assert.equal(tuningTargetLabel(twelve, 0), 'Course 6, main string');
  assert.equal(tuningTargetLabel(twelve, 1), 'Course 6, paired string');
  assert.equal(tuningTargetLabel(twelve, 11), 'Course 1, paired string');
});

test('ordinary string numbering follows instrument convention', () => {
  const guitar = TUNING_PRESETS.find((p) => p.id === 'guitar-acoustic-standard');
  const bass = TUNING_PRESETS.find((p) => p.id === 'bass-4-standard');
  assert.ok(guitar && bass);
  assert.equal(tuningTargetLabel(guitar, 0), 'String 6');
  assert.equal(tuningTargetLabel(guitar, 5), 'String 1');
  assert.equal(tuningTargetLabel(bass, 0), 'String 4');
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
