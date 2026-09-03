import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  centsBetween,
  median,
  pushWindow,
  verdictForCents,
  nearestStringIndex,
  correctSelectedStringHarmonic,
  frequencySpreadCents,
  SMOOTH_WINDOW,
  OFF_CENTS,
  STRING_MATCH_CENTS,
} from '../features/tuner/pitch';

const E2 = 82.4069;
const A2 = 110.0;
const STANDARD = [82.4069, 110.0, 146.8324, 195.9977, 246.9417, 329.6276];

test('a pitch exactly on target is zero cents', () => {
  assert.equal(Math.round(centsBetween(E2, E2)), 0);
});

test('sharp is positive and flat is negative', () => {
  assert.ok(centsBetween(E2 * 1.01, E2) > 0, 'sharp should read positive');
  assert.ok(centsBetween(E2 * 0.99, E2) < 0, 'flat should read negative');
});

test('an octave is 1200 cents', () => {
  assert.equal(Math.round(centsBetween(E2 * 2, E2)), 1200);
  assert.equal(Math.round(centsBetween(E2 / 2, E2)), -1200);
});

test('a semitone is 100 cents', () => {
  assert.equal(Math.round(centsBetween(E2 * Math.pow(2, 1 / 12), E2)), 100);
});

test('nonsense input does not produce NaN', () => {
  assert.equal(centsBetween(0, E2), 0);
  assert.equal(centsBetween(E2, 0), 0);
  assert.equal(centsBetween(-5, E2), 0);
});

test('the median ignores a single wild outlier', () => {
  // A detector octave-jump: one frame reads double. A mean would be dragged
  // ~16Hz sharp; the median should not move at all.
  const readings = [110.0, 110.1, 220.0, 109.9, 110.0];
  assert.equal(median(readings), 110.0);
  const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
  assert.ok(Math.abs(mean - 110) > 15, 'the mean really is dragged that far');
});

test('the median handles even counts and empty input', () => {
  assert.equal(median([]), 0);
  assert.equal(median([100, 200]), 150);
  assert.equal(median([5]), 5);
});

test('the median does not disturb the caller array', () => {
  const values = [3, 1, 2];
  median(values);
  assert.deepEqual(values, [3, 1, 2]);
});

test('the smoothing window keeps only the most recent readings', () => {
  let w: number[] = [];
  for (let i = 1; i <= SMOOTH_WINDOW + 3; i++) w = pushWindow(w, i);
  assert.equal(w.length, SMOOTH_WINDOW);
  assert.equal(w[w.length - 1], SMOOTH_WINDOW + 3, 'newest must be last');
  assert.equal(w[0], 4, 'oldest readings should have fallen off');
});

test('frequency spread is measured in cents and ignores malformed entries', () => {
  assert.equal(Math.round(frequencySpreadCents([440, 440, 0, NaN])), 0);
  assert.equal(
    Math.round(frequencySpreadCents([440, 440 * 2 ** (12 / 1200)])),
    12,
  );
});

test('selected-string correction recognizes overtones and period doubling', () => {
  assert.equal(correctSelectedStringHarmonic(E2 * 2, E2).ratio, 2);
  assert.equal(correctSelectedStringHarmonic(E2 * 3, E2).ratio, 3);
  assert.equal(correctSelectedStringHarmonic(E2 * 4, E2).ratio, 4);
  assert.equal(correctSelectedStringHarmonic(E2 / 2, E2).ratio, 0.5);
});

test('harmonic correction does not force an unrelated pitch onto the target', () => {
  assert.deepEqual(correctSelectedStringHarmonic(A2, E2), {
    frequency: A2,
    ratio: 1,
  });
});

test('a reading of zero cents is in tune, and matches what is displayed', () => {
  assert.equal(verdictForCents(0), 'in-tune');
  assert.equal(verdictForCents(0.4), 'in-tune');
  assert.equal(verdictForCents(-0.4), 'in-tune');
});

test('the default in-tune window is one cent', () => {
  for (const c of [0.01, 1, -0.01, -1]) {
    assert.equal(verdictForCents(c), 'in-tune', `${c} cents should be in tune`);
  }
});

test('more than one but less than ten cents is close by default', () => {
  for (const c of [1.01, 5, 9.99, -1.01, -5, -9.99]) {
    assert.equal(verdictForCents(c), 'close', `${c} cents should be close`);
  }
});

test('the in-tune window is configurable and safely bounded', () => {
  assert.equal(verdictForCents(1, 1), 'in-tune');
  assert.equal(verdictForCents(2, 1), 'close');
  assert.equal(verdictForCents(5, 99), 'in-tune');
  assert.equal(verdictForCents(6, 99), 'close');
  assert.equal(verdictForCents(0.5, 0.5), 'in-tune');
  assert.equal(verdictForCents(0.6, 0.5), 'close');
});

test('ten cents or more is off, either direction', () => {
  for (const c of [OFF_CENTS, 25, 400, -OFF_CENTS, -25, -400]) {
    assert.equal(verdictForCents(c), 'off', `${c} cents should be off`);
  }
});

test('the off boundary sits exactly at ten cents', () => {
  assert.equal(verdictForCents(9.99), 'close');
  assert.equal(verdictForCents(10), 'off');
});

test('the nearest string is the one actually being played', () => {
  assert.equal(nearestStringIndex(E2, STANDARD), 0);
  assert.equal(nearestStringIndex(A2, STANDARD), 1);
  assert.equal(nearestStringIndex(329.6276, STANDARD), 5);
});

test('a slightly out-of-tune string still matches itself', () => {
  assert.equal(nearestStringIndex(A2 * 1.02, STANDARD), 1, 'sharp A is still A');
  assert.equal(nearestStringIndex(A2 * 0.98, STANDARD), 1, 'flat A is still A');
});

test('a pitch nowhere near any string matches nothing', () => {
  // Only pitches outside the instrument's range are unmatched: adjacent
  // strings are about 500 cents apart, so a 250-cent window either side
  // leaves no gap between them to fall into.
  assert.equal(nearestStringIndex(20, STANDARD), null, 'far below the low E');
  assert.equal(nearestStringIndex(2000, STANDARD), null, 'far above the high e');
});

test('the match window is honoured at its edge', () => {
  const justInside = A2 * Math.pow(2, (STRING_MATCH_CENTS - 5) / 1200);
  const justOutside = A2 * Math.pow(2, (STRING_MATCH_CENTS + 5) / 1200);
  assert.equal(nearestStringIndex(justInside, STANDARD), 1);
  assert.notEqual(nearestStringIndex(justOutside, STANDARD), 1);
});
