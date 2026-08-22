import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  toDateKey,
  fromDateKey,
  daysBetween,
  nextStreak,
  streakAsOf,
  minutesFrom,
  pruneLog,
} from '../features/practice/streak';

test('a date key is the local calendar day, zero padded', () => {
  assert.equal(toDateKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(toDateKey(new Date(2026, 11, 31)), '2026-12-31');
});

test('a key round-trips back to local midnight', () => {
  const d = fromDateKey('2026-03-09');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 2);
  assert.equal(d.getDate(), 9);
  assert.equal(d.getHours(), 0);
});

test('a late-evening local time still keys to that local day', () => {
  // A naive UTC-based key would roll this over to the 6th for anyone east
  // of Greenwich, breaking the streak for late-night practice.
  assert.equal(toDateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(toDateKey(new Date(2026, 0, 5, 0, 1)), '2026-01-05');
});

test('days between counts whole days in both directions', () => {
  assert.equal(daysBetween('2026-01-05', '2026-01-06'), 1);
  assert.equal(daysBetween('2026-01-05', '2026-01-05'), 0);
  assert.equal(daysBetween('2026-01-06', '2026-01-05'), -1);
  assert.equal(daysBetween('2026-01-01', '2026-02-01'), 31);
});

test('days between survives a month and a year boundary', () => {
  assert.equal(daysBetween('2026-01-31', '2026-02-01'), 1);
  assert.equal(daysBetween('2026-12-31', '2027-01-01'), 1);
  assert.equal(daysBetween('2028-02-28', '2028-02-29'), 1, 'leap day');
});

test('days between survives a daylight-saving change', () => {
  // Whatever the host zone, a calendar day apart must read as 1 even when
  // the day is 23 or 25 hours long.
  for (const [a, b] of [
    ['2026-03-28', '2026-03-29'],
    ['2026-03-29', '2026-03-30'],
    ['2026-10-24', '2026-10-25'],
    ['2026-10-25', '2026-10-26'],
    ['2026-11-01', '2026-11-02'],
  ]) {
    assert.equal(daysBetween(a, b), 1, `${a} -> ${b}`);
  }
});

test('a first ever session starts the streak at one', () => {
  assert.equal(nextStreak(null, 0, '2026-01-05'), 1);
});

test('practising again the same day does not inflate the streak', () => {
  assert.equal(nextStreak('2026-01-05', 3, '2026-01-05'), 3);
});

test('practising the next day extends the streak', () => {
  assert.equal(nextStreak('2026-01-05', 3, '2026-01-06'), 4);
});

test('missing a day resets the streak to one', () => {
  assert.equal(nextStreak('2026-01-05', 9, '2026-01-07'), 1);
  assert.equal(nextStreak('2026-01-05', 9, '2026-02-05'), 1);
});

test('a backwards clock does not corrupt the streak', () => {
  assert.equal(nextStreak('2026-01-06', 4, '2026-01-05'), 4);
});

test('a stale streak reads as zero until it is fed again', () => {
  assert.equal(streakAsOf('2026-01-05', 9, '2026-01-05'), 9, 'fed today');
  assert.equal(streakAsOf('2026-01-05', 9, '2026-01-06'), 9, 'still alive today');
  assert.equal(streakAsOf('2026-01-05', 9, '2026-01-07'), 0, 'a day was missed');
  assert.equal(streakAsOf(null, 0, '2026-01-07'), 0);
});

test('a streak survives across a month boundary', () => {
  assert.equal(nextStreak('2026-01-31', 6, '2026-02-01'), 7);
  assert.equal(streakAsOf('2026-01-31', 7, '2026-02-01'), 7);
});

test('minutes round down from seconds', () => {
  assert.equal(minutesFrom(0), 0);
  assert.equal(minutesFrom(59), 0);
  assert.equal(minutesFrom(60), 1);
  assert.equal(minutesFrom(3599), 59);
});

test('pruning drops ancient entries and keeps recent ones', () => {
  const log = {
    '2026-01-05': 600,
    '2025-01-05': 600,
    '2020-01-05': 600,
  };
  const kept = pruneLog(log, '2026-01-06', 400);
  assert.ok('2026-01-05' in kept);
  assert.ok('2025-01-05' in kept, 'within 400 days');
  assert.ok(!('2020-01-05' in kept), 'six years old should go');
});

test('pruning keeps future-dated entries rather than losing them', () => {
  const kept = pruneLog({ '2026-06-01': 300 }, '2026-01-06', 400);
  assert.ok('2026-06-01' in kept);
});
