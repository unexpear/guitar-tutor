import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TRAINING_ROUND_LENGTH,
  earQuestion,
  fretQuestion,
  fretboardNote,
  intervalHint,
  noteNameFromMidi,
  rhythmAccuracy,
} from '../features/games/training/training';

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

test('guided training is shorter and removes excess choices', () => {
  assert.equal(TRAINING_ROUND_LENGTH.guided, 6);
  for (let round = 0; round < 20; round += 1) {
    assert.equal(earQuestion(0.42, round, 'guided').options.length, 3);
    assert.equal(fretQuestion(0.42, round, 'guided').options.length, 3);
  }
});

test('challenge training uses a broader four-choice problem set', () => {
  const frets = new Set<number>();
  for (let seedIndex = 0; seedIndex < 100; seedIndex += 1) {
    for (let round = 0; round < 30; round += 1) {
      const question = fretQuestion(seedIndex / 101, round, 'challenge');
      frets.add(question.fretNumber);
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.equal(question.options.filter((option) => option === question.answer).length, 1);
      const ear = earQuestion(seedIndex / 101, round, 'challenge');
      assert.equal(new Set(ear.options.map((option) => option.name)).size, 4);
      assert.equal(ear.options.filter((option) => option.name === ear.answer.name).length, 1);
    }
  }
  assert.ok(frets.size >= 10);
  assert.match(intervalHint(12), /same note.*higher/i);
});
