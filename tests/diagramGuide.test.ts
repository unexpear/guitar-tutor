import assert from 'node:assert/strict';
import test from 'node:test';
import { getChord } from '../features/chords/data/chords';
import {
  CHORD_DIAGRAM_QUIZ,
  describeChordDiagram,
  frettingFingerName,
} from '../features/chords/data/diagramGuide';

test('finger numbers use the standard fretting-hand mapping', () => {
  assert.equal(frettingFingerName(1), 'index');
  assert.equal(frettingFingerName(2), 'middle');
  assert.equal(frettingFingerName(3), 'ring');
  assert.equal(frettingFingerName(4), 'little finger');
});

test('Em description gives complete open-chord placement', () => {
  const description = describeChordDiagram(getChord('Em')!, false);
  assert.match(description, /low E \(6th string\) open/);
  assert.match(description, /A \(5th string\) fret 2 with finger 2, middle/);
  assert.match(description, /D \(4th string\) fret 2 with finger 3, ring/);
  assert.match(description, /high e \(1st string\) open/);
});

test('left-handed description states the mirrored visual order', () => {
  const description = describeChordDiagram(getChord('A')!, true);
  assert.match(description, /high e to low E from left to right for left-handed view/);
  assert.match(description, /low E \(6th string\) muted/);
});

test('barre descriptions explain the span once and preserve other fingers', () => {
  const description = describeChordDiagram(getChord('F')!, false);
  assert.match(description, /Barre fret 1 from low E \(6th string\) through high e \(1st string\) with finger 1, index/);
  assert.match(description, /G \(3rd string\) fret 2 with finger 2, middle/);
  assert.doesNotMatch(description, /high e \(1st string\) fret 1/);
});

test('quiz is a complete five-question check with valid answers', () => {
  assert.equal(CHORD_DIAGRAM_QUIZ.length, 5);
  assert.equal(new Set(CHORD_DIAGRAM_QUIZ.map((question) => question.id)).size, 5);
  for (const question of CHORD_DIAGRAM_QUIZ) {
    assert.ok(getChord(question.chordName), `${question.chordName} must exist`);
    assert.ok(question.options.length >= 3);
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length);
    assert.ok(question.explanation.length > 10);
  }
});

