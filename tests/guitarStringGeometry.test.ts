import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guitarStringPath } from '../features/tuner/components/guitarStringGeometry';
import { GUITAR_MODELS, isImportedGuitar } from '../features/progression/guitarModels';

test('legacy SVG models have six distinct, ordered nut-to-saddle highlights', () => {
  for (const model of GUITAR_MODELS.filter(model => !isImportedGuitar(model.id))) {
    const paths = Array.from({ length: 6 }, (_, i) => guitarStringPath(model.id, i));
    assert.equal(new Set(paths).size, 6);
    let previousX = 0;
    for (const path of paths) {
      const values = path!.match(/[\d.]+/g)!.map(Number);
      assert.equal(values.length, 4);
      assert.ok(values.every(v => Number.isFinite(v) && v > 0 && v < 320));
      assert.ok(values[3] > values[1]);
      assert.ok(values[0] > previousX);
      previousX = values[0];
    }
    for (const invalid of [-1, 6, 0.5, NaN]) assert.equal(guitarStringPath(model.id, invalid), null);
  }
});

test('imported thumbnails do not use guessed SVG string coordinates', () => {
  for (const model of GUITAR_MODELS.filter(model => isImportedGuitar(model.id))) {
    for (let i = 0; i < 6; i++) assert.equal(guitarStringPath(model.id, i), null);
  }
});
