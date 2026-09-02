import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCustomTuning, exportCustomTunings, importCustomTunings, normalizeNote, validateCustomTuning } from '../features/tuner/customTuning';

test('custom tuning normalizes note spelling and preserves string order', () => {
  const tuning = createCustomTuning({ name: '  Open test ', instrumentId: 'guitar-acoustic', strings: ['d2', 'A2', 'f#3'] }, 'custom-test');
  assert.equal(tuning.name, 'Open test');
  assert.deepEqual(tuning.strings, ['D2', 'A2', 'F#3']);
  assert.equal(normalizeNote('bb3'), 'Bb3');
});

test('custom tuning rejects missing octaves and unsafe lengths', () => {
  assert.match(validateCustomTuning({ name: 'Bad', instrumentId: 'guitar-acoustic', strings: ['E'] }) ?? '', /note and octave/);
  assert.match(validateCustomTuning({ name: 'Bad', instrumentId: 'guitar-acoustic', strings: [] }) ?? '', /between 1 and 12/);
});

test('custom tuning backup round-trips through validated JSON', () => {
  const source = [createCustomTuning({ name: 'Bass drop', instrumentId: 'bass-4', strings: ['D1', 'A1', 'D2', 'G2'] }, 'custom-source')];
  const restored = importCustomTunings(exportCustomTunings(source));
  assert.equal(restored.length, 1);
  assert.equal(restored[0].name, 'Bass drop');
  assert.deepEqual(restored[0].strings, source[0].strings);
  assert.notEqual(restored[0].id, source[0].id, 'imports receive collision-safe local ids');
});

test('custom tuning import rejects arbitrary JSON', () => {
  assert.throws(() => importCustomTunings('{"tunings":[]}'), /not a StandardTune/);
  assert.throws(() => importCustomTunings('not-json'), /valid JSON/);
});
