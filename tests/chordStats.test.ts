import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ChordStats,
  recordAttempt,
  accuracy,
  verdictFor,
  practicePriority,
  rankForPractice,
  MIN_ATTEMPTS_FOR_VERDICT,
} from '../features/practice/chordStats';

const DAY = (d: number) => new Date(2026, 0, d);

test('a first attempt creates the entry', () => {
  const s = recordAttempt({}, 'Em', true, DAY(5));
  assert.deepEqual(s.Em, { attempts: 1, correct: 1, lastAt: '2026-01-05' });
});

test('attempts accumulate and wrong ones do not count as correct', () => {
  let s: ChordStats = {};
  s = recordAttempt(s, 'Em', true, DAY(5));
  s = recordAttempt(s, 'Em', false, DAY(5));
  s = recordAttempt(s, 'Em', true, DAY(6));
  assert.deepEqual(s.Em, { attempts: 3, correct: 2, lastAt: '2026-01-06' });
});

test('recording does not mutate the object it was given', () => {
  const before: ChordStats = { Em: { attempts: 1, correct: 1, lastAt: '2026-01-05' } };
  const after = recordAttempt(before, 'Em', false, DAY(6));
  assert.equal(before.Em.attempts, 1, 'original was mutated');
  assert.equal(after.Em.attempts, 2);
});

test('chords are tracked independently', () => {
  let s: ChordStats = {};
  s = recordAttempt(s, 'Em', true, DAY(5));
  s = recordAttempt(s, 'Am', false, DAY(5));
  assert.equal(s.Em.correct, 1);
  assert.equal(s.Am.correct, 0);
});

test('accuracy is null until there is something to measure', () => {
  assert.equal(accuracy(undefined), null);
  assert.equal(accuracy({ attempts: 0, correct: 0, lastAt: '2026-01-05' }), null);
  assert.equal(accuracy({ attempts: 4, correct: 3, lastAt: '2026-01-05' }), 75);
  assert.equal(accuracy({ attempts: 3, correct: 1, lastAt: '2026-01-05' }), 33);
});

test('a chord you have never tried is untried, not bad at', () => {
  assert.equal(verdictFor(undefined), 'untried');
  assert.equal(verdictFor({ attempts: 0, correct: 0, lastAt: '2026-01-05' }), 'untried');
});

test('too few attempts reads as learning rather than a verdict', () => {
  for (let n = 1; n < MIN_ATTEMPTS_FOR_VERDICT; n++) {
    const stat = { attempts: n, correct: 0, lastAt: '2026-01-05' };
    assert.equal(verdictFor(stat), 'learning', `${n} attempts should not convict`);
  }
});

test('enough attempts splits solid from shaky at 75 percent', () => {
  assert.equal(verdictFor({ attempts: 4, correct: 3, lastAt: '2026-01-05' }), 'solid');
  assert.equal(verdictFor({ attempts: 4, correct: 2, lastAt: '2026-01-05' }), 'shaky');
  assert.equal(verdictFor({ attempts: 8, correct: 8, lastAt: '2026-01-05' }), 'solid');
});

test('a chord you keep missing outranks one you have merely not seen', () => {
  const weak = { attempts: 10, correct: 2, lastAt: '2026-01-05' };
  assert.ok(
    practicePriority(weak, '2026-01-05') > practicePriority(undefined, '2026-01-05'),
    'failing beats untried'
  );
});

test('a solid chord gets staler but never outranks an actively failing one', () => {
  const solid = { attempts: 10, correct: 10, lastAt: '2025-01-05' }; // a year ago
  const failing = { attempts: 10, correct: 1, lastAt: '2026-01-05' };
  assert.ok(
    practicePriority(failing, '2026-01-05') > practicePriority(solid, '2026-01-05'),
    'staleness should not outweigh weakness'
  );
});

test('staleness does lift a chord that has gone untouched', () => {
  const stat = { attempts: 10, correct: 8, lastAt: '2026-01-05' };
  const fresh = practicePriority(stat, '2026-01-05');
  const stale = practicePriority(stat, '2026-02-05');
  assert.ok(stale > fresh, 'an untouched chord should climb');
});

test('ranking puts the worst first and is stable on ties', () => {
  const stats: ChordStats = {
    Em: { attempts: 10, correct: 10, lastAt: '2026-01-05' }, // solid
    Am: { attempts: 10, correct: 2, lastAt: '2026-01-05' }, // bad
    C: { attempts: 10, correct: 6, lastAt: '2026-01-05' }, // middling
  };
  const ranked = rankForPractice(['Em', 'Am', 'C', 'G', 'D'], stats, DAY(5));
  assert.equal(ranked[0], 'Am', 'the worst chord should come first');
  assert.equal(ranked[ranked.length - 1], 'Em', 'the solid one should come last');
  // G and D are both untried, so they tie and must sort by name.
  assert.deepEqual(
    ranked.filter((n) => n === 'D' || n === 'G'),
    ['D', 'G']
  );
});

test('ranking does not mutate the list it was given', () => {
  const names = ['Em', 'Am'];
  rankForPractice(names, {}, DAY(5));
  assert.deepEqual(names, ['Em', 'Am']);
});
