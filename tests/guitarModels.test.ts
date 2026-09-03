import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_GUITAR_MODEL_IDS,
  GUITAR_MODELS,
  guitarModel,
  guitarModelsForType,
  selectedModelId,
} from '../features/progression/guitarModels';

test('the picker offers multiple free models for both guitar families', () => {
  assert.equal(guitarModelsForType('acoustic').length >= 2, true);
  assert.equal(guitarModelsForType('electric').length >= 2, true);
  assert.equal(new Set(GUITAR_MODELS.map((model) => model.id)).size, GUITAR_MODELS.length);
});

test('saved model ids are constrained to their instrument family', () => {
  assert.equal(selectedModelId({ acoustic: 'acoustic-cutaway' }, 'acoustic'), 'acoustic-cutaway');
  assert.equal(
    selectedModelId({ acoustic: 'electric-singlecut' }, 'acoustic'),
    DEFAULT_GUITAR_MODEL_IDS.acoustic,
  );
  assert.equal(selectedModelId(undefined, 'electric'), DEFAULT_GUITAR_MODEL_IDS.electric);
  assert.equal(guitarModel('not-a-model'), undefined);
});
