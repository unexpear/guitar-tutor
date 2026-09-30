import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { GUITAR_MODELS, isImportedGuitar } from '../features/progression/guitarModels';
import { claimReward, emptyRewards } from '../features/progression/guitarRewards';

test('only approved imported models are packaged, static, self-contained and have six mesh string targets', async () => {
  const models = JSON.parse(await readFile(new URL('../assets/guitars/imported/models.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(models).sort(), ['acoustic-classical', 'electric-cotton-candy']);
  assert.deepEqual(GUITAR_MODELS.filter(m => isImportedGuitar(m.id)).map(m => m.id).sort(), Object.keys(models).sort());
  for (const data of Object.values(models)) {
    const bytes = Buffer.from(data as string, 'base64');
    assert.equal(bytes.readUInt32LE(0), 0x46546c67);
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    assert.equal(gltf.animations?.length ?? 0, 0);
    assert.equal(gltf.skins?.length ?? 0, 0);
    assert.ok(gltf.buffers.every((b: {uri?: string}) => !b.uri));
    assert.ok(gltf.images.every((i: {uri?: string; bufferView?: number}) => !i.uri && Number.isInteger(i.bufferView)));
    for (let i = 1; i <= 6; i++) {
      const targets = gltf.nodes.filter((n: {name?: string}) => n.name === `String_${i}`);
      assert.equal(targets.length, 1);
      assert.ok(Number.isInteger(targets[0].mesh));
    }
  }
});

test('imported preview bodies stay labeled as unaccepted phone previews', () => {
  for (const model of GUITAR_MODELS.filter((item) => isImportedGuitar(item.id))) {
    assert.match(model.description, /preview/i);
    assert.match(model.description, /not accepted/i);
    assert.doesNotMatch(model.description, /photoreal/i);
  }
});

test('Play store listing does not advertise imported preview bodies', async () => {
  const files = [
    '../fastlane/metadata/android/en-US/full_description.txt',
    '../fastlane/metadata/android/en-US/short_description.txt',
    '../distribution/whatsnew/whatsnew-en-US',
  ];
  for (const file of files) {
    const listing = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(listing, /Cotton Candy/i);
    assert.doesNotMatch(listing, /imported/i);
    assert.doesNotMatch(listing, /Reticle/i);
  }
});

test('fixed imported finishes stay outside new weighted rewards', () => {
  const originalIds = ['acoustic-grand', 'acoustic-cutaway', 'electric-doublecut', 'electric-singlecut'];
  for (let seed = 0; seed < 100; seed++) {
    const result = claimReward(emptyRewards(), new Date(2026, 8, 7), () => (seed + .1) / 2147483647);
    assert.ok(originalIds.includes(result.collection[0].modelId));
    assert.equal(isImportedGuitar(result.collection[0].modelId), false);
  }
});
