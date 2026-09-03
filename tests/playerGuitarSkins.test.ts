import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

import { GUITAR_DESIGNS } from '../features/progression/guitarDesigns';
import { GUITAR_MODELS } from '../features/progression/guitarModels';

const SKIN_DIRECTORY = new URL('../assets/guitars/player-skins/', import.meta.url);
const ASSET_CATALOG = new URL('../features/progression/guitarModelAssets.ts', import.meta.url);

test('every guitar shape has ten additive bundled player skins', async () => {
  const files = await readdir(SKIN_DIRECTORY);
  const catalog = await readFile(ASSET_CATALOG, 'utf8');

  assert.equal(files.length, GUITAR_MODELS.length * 10);
  for (const model of GUITAR_MODELS) {
    const modelFiles = files.filter((file) => file.startsWith(`${model.id}--`));
    assert.equal(modelFiles.length, 10, `${model.id} should have ten skins`);
    for (const file of modelFiles) {
      const designId = file.slice(`${model.id}--`.length, -'.png'.length);
      const design = GUITAR_DESIGNS.find((candidate) => candidate.id === designId);
      assert.equal(design?.guitarType, model.guitarType, `${file} should use a compatible locker design`);
      assert.match(catalog, new RegExp(`player-skins/${file.replace('.', '\\.')}['"]\\)`));
    }
  }
});

test('the existing fallback asset families remain available', async () => {
  const catalog = await readFile(ASSET_CATALOG, 'utf8');
  for (const family of ['wood', 'metallic', 'crystal']) {
    assert.match(catalog, new RegExp(`${family}: require\\(`));
  }
  assert.match(catalog, /export const FULL_GUITAR_PLAYER_SKINS/);
});
