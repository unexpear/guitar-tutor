import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { FINISH_FAMILIES, GUITAR_MODEL_PIPELINE } from './guitar-models.config.mjs';
import { runPaintSystem, runPlayerSkinSystem } from './guitar-paint-system.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUTPUT = path.join(ROOT, 'assets', 'guitars');
const CHECK_ONLY = process.argv.includes('--check');
const PAINT_MODE = process.argv.includes('--paint');
const PLAYER_SKIN_MODE = process.argv.includes('--player-skins');
const SIZE = { width: 512, height: 768 };

function argumentAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function assetPaths(model, family) {
  const stem = model.assetStem ?? model.id;
  return {
    full: path.join(OUTPUT, `${stem}-${family}.png`),
    headstock: path.join(OUTPUT, `headstock-${stem}-${family}.png`),
  };
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function proceduralFinish(woodSource, family) {
  const image = sharp(woodSource).resize(SIZE.width, SIZE.height, { fit: 'fill' });
  if (family === 'metallic') {
    return image.greyscale().tint('#AEB8C8').modulate({ brightness: 1.03, saturation: 0.72 }).png().toBuffer();
  }
  if (family === 'crystal') {
    return image.greyscale().tint('#BCEBFF').modulate({ brightness: 1.12, saturation: 0.62 }).png().toBuffer();
  }
  return image.png().toBuffer();
}

async function sourceFor(model, family) {
  const configured = model.sources[family];
  if (configured) return path.join(ROOT, configured);
  const woodSource = path.join(ROOT, model.sources.wood);
  return proceduralFinish(woodSource, family);
}

async function validatePng(file, label) {
  if (!(await exists(file))) throw new Error(`${label}: missing ${path.relative(ROOT, file)}`);
  const metadata = await sharp(file).metadata();
  if (metadata.width !== SIZE.width || metadata.height !== SIZE.height) {
    throw new Error(`${label}: expected ${SIZE.width}x${SIZE.height}, got ${metadata.width}x${metadata.height}`);
  }
  if (!metadata.hasAlpha) throw new Error(`${label}: PNG must contain transparency`);
  const stats = await sharp(file).stats();
  if (stats.isOpaque) throw new Error(`${label}: alpha channel is fully opaque`);
}

async function generateModel(model) {
  if (model.preserveBaseAssets) return;
  for (const family of FINISH_FAMILIES) {
    const source = await sourceFor(model, family);
    const paths = assetPaths(model, family);
    await sharp(source)
      .resize(SIZE.width, SIZE.height, { fit: 'fill' })
      .png({ compressionLevel: 9, palette: true, quality: 95 })
      .toFile(paths.full);
    const headstockCrop = await sharp(source)
      .resize(SIZE.width, SIZE.height, { fit: 'fill' })
      .extract(model.headstockCrop)
      .png()
      .toBuffer();
    await sharp(headstockCrop)
      .resize(SIZE.width, SIZE.height, { fit: 'fill' })
      .png({ compressionLevel: 9, palette: true, quality: 95 })
      .toFile(paths.headstock);
  }
}

async function validateModel(model) {
  for (const family of FINISH_FAMILIES) {
    const paths = assetPaths(model, family);
    await validatePng(paths.full, `${model.id}/${family} full guitar`);
    await validatePng(paths.headstock, `${model.id}/${family} headstock`);
  }
}

if (PLAYER_SKIN_MODE) {
  await runPlayerSkinSystem({
    root: ROOT,
    checkOnly: CHECK_ONLY,
    modelId: argumentAfter('--model'),
  });
} else if (PAINT_MODE) {
  await runPaintSystem({
    root: ROOT,
    checkOnly: CHECK_ONLY,
    modelId: argumentAfter('--model'),
    presetId: argumentAfter('--preset'),
  });
} else {
  await mkdir(OUTPUT, { recursive: true });
  const generatedModels = GUITAR_MODEL_PIPELINE.filter((model) => !model.preserveBaseAssets);
  for (const model of generatedModels) {
    if (!CHECK_ONLY) await generateModel(model);
    await validateModel(model);
  }
  console.log(`${CHECK_ONLY ? 'Validated' : 'Generated and validated'} ${generatedModels.length} models × ${FINISH_FAMILIES.length} finishes.`);
}
