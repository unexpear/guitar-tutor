import assert from 'node:assert/strict';
import test from 'node:test';
import { headstockColumns, visualStringOrder } from '../features/tuner/leftHandLayout';

test('right-handed headstock keeps the low strings on the left', () => {
  assert.deepEqual(headstockColumns(false), [[0, 1, 2], [3, 4, 5]]);
});

test('left-handed headstock puts the low strings on the right', () => {
  assert.deepEqual(headstockColumns(true), [[3, 4, 5], [0, 1, 2]]);
});

test('left-handed string row reverses display order and keeps indexes', () => {
  assert.deepEqual(visualStringOrder(5, false), [0, 1, 2, 3, 4]);
  assert.deepEqual(visualStringOrder(5, true), [4, 3, 2, 1, 0]);
});
