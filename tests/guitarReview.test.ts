import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const context: any = {};
runInNewContext(readFileSync(new URL('../tools/guitar-finish-studio/review.js', import.meta.url), 'utf8'), context);
const { score, distance, key } = context.GuitarReview;
const red = { primary: '#aa2233', accent: '#ffdd88', primaryFinish: 'Gloss', accentFinish: 'Metallic Flake', pattern: 'Center Stripe', textureStrength: 40, patternScale: 100, seed: 1 };
const blue = { ...red, primary: '#1122bb', accent: '#00aaff', primaryFinish: 'Matte', pattern: 'Split' };

test('review recommendations favor nearby keeps and learn from passes', () => {
  const history = [{ design: red, keep: true }, { design: blue, keep: false }];
  assert.ok(score({ ...red, primary: '#ab2233' }, history) > score({ ...blue, primary: '#1122bc' }, history));
  assert.equal(score(red, []), 0);
  assert.equal(score(red, [{ design: red, keep: false }]), -1);
  assert.equal(score(red, [{ design: red, keep: true }]), 1);
});

test('review identity is stable across property order and distance ignores texture seed', () => {
  assert.equal(key(red), key(Object.fromEntries(Object.entries(red).reverse())));
  assert.equal(distance(red, { ...red, seed: 900 }), 0);
  assert.notEqual(key(red), key({ ...red, seed: 900 }));
  assert.equal(distance(red, blue), distance(blue, red));
});
