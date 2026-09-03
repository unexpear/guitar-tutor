import assert from 'node:assert/strict';
import test from 'node:test';

import { getStringGuidance, HEADSTOCK_PEGS } from '../features/tuner/headstockGuidance';

test('headstock guidance maps every tuner string to a distinct path and peg', () => {
  for (const guitarType of ['acoustic', 'electric'] as const) {
    const guidance = Array.from({ length: 6 }, (_, index) => getStringGuidance(guitarType, index));
    assert.equal(guidance.every(Boolean), true);
    assert.equal(new Set(guidance.map((item) => item?.path)).size, 6);

    guidance.forEach((item, index) => {
      assert.deepEqual(item?.peg, HEADSTOCK_PEGS[guitarType][index]);
    });
  }
});

test('peg order follows standard tuning from low E to high E', () => {
  const acoustic = HEADSTOCK_PEGS.acoustic;
  assert.deepEqual(acoustic.map((peg) => peg.y), [164, 119, 73, 73, 119, 164]);

  const electric = HEADSTOCK_PEGS.electric;
  assert.equal(electric[0].y > electric[5].y, true);
});

test('headstock guidance safely rejects invalid tuner indexes', () => {
  assert.equal(getStringGuidance('acoustic', undefined), null);
  assert.equal(getStringGuidance('acoustic', -1), null);
  assert.equal(getStringGuidance('electric', 6), null);
  assert.equal(getStringGuidance('electric', 1.5), null);
});

test('alternate models use geometry fitted to their own tuning posts', () => {
  const defaultAcoustic = getStringGuidance('acoustic', 0);
  const cutawayAcoustic = getStringGuidance('acoustic', 0, 'acoustic-cutaway');
  const defaultElectric = getStringGuidance('electric', 5);
  const singlecutElectric = getStringGuidance('electric', 5, 'electric-singlecut');

  assert.notDeepEqual(cutawayAcoustic?.peg, defaultAcoustic?.peg);
  assert.notDeepEqual(singlecutElectric?.peg, defaultElectric?.peg);
});
