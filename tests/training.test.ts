import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fretboardNote, noteNameFromMidi, rhythmAccuracy } from '../features/games/training/training';

test('fretboard note maths follows standard guitar tuning', () => {
  assert.equal(fretboardNote(0, 0), 'E');
  assert.equal(fretboardNote(0, 12), 'E');
  assert.equal(fretboardNote(1, 3), 'C');
  assert.equal(fretboardNote(5, 1), 'F');
  assert.throws(() => fretboardNote(6, 0));
});

test('MIDI note labels include the correct octave', () => {
  assert.equal(noteNameFromMidi(60), 'C4');
  assert.equal(noteNameFromMidi(69), 'A4');
});

test('rhythm accuracy rewards steady target gaps and penalizes drift', () => {
  assert.equal(rhythmAccuracy([0, 500, 1000, 1500], 500), 100);
  assert.ok(rhythmAccuracy([0, 650, 1000, 1700], 500) < 80);
  assert.equal(rhythmAccuracy([0], 500), 0);
});
