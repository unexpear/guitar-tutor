import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { GUITAR_MODEL_PIPELINE, PAINT_FINISHES, PAINT_PRESETS } from './guitar-models.config.mjs';

const SIZE = { width: 512, height: 768 };
const PATTERNS = ['center-stripe', 'split', 'edge-burst', 'pinstripes'];

function validateRecipe(recipe) {
  if (!/^[a-z0-9-]+$/.test(recipe.id)) throw new Error(`Invalid paint preset id: ${recipe.id}`);
  if (!/^#[0-9A-F]{6}$/i.test(recipe.primary) || !/^#[0-9A-F]{6}$/i.test(recipe.accent)) {
    throw new Error(`${recipe.id}: paint colors must be six-digit hex values`);
  }
  if (!PAINT_FINISHES.includes(recipe.primaryFinish) || !PAINT_FINISHES.includes(recipe.accentFinish)) {
    throw new Error(`${recipe.id}: unknown paint finish`);
  }
  if (!PATTERNS.includes(recipe.pattern)) throw new Error(`${recipe.id}: unknown accent pattern`);
}

function zones(model) {
  return `${model.paintZones.body} ${model.paintZones.headstock}`;
}

function fullMask(model) {
  return Buffer.from(`<svg width="512" height="768" xmlns="http://www.w3.org/2000/svg"><defs><mask id="paint"><path d="${zones(model)}" fill="white"/><g fill="black">${model.paintZones.exclusions}</g></mask></defs><rect width="512" height="768" fill="white" mask="url(#paint)"/></svg>`);
}

function accentMask(model, pattern) {
  const shape = {
    'center-stripe': '<rect x="225" width="62" height="768" fill="white"/>',
    split: '<rect x="256" width="256" height="768" fill="white"/>',
    'edge-burst': '<rect width="512" height="768" fill="url(#edge)"/>',
    pinstripes: '<path d="M218 0H230L246 768H234ZM282 0H294L278 768H266Z" fill="white"/>',
  }[pattern];
  return Buffer.from(`<svg width="512" height="768" xmlns="http://www.w3.org/2000/svg"><defs><mask id="paint"><path d="${zones(model)}" fill="white"/><g fill="black">${model.paintZones.exclusions}</g></mask><radialGradient id="edge"><stop offset="42%" stop-color="white" stop-opacity="0"/><stop offset="100%" stop-color="white" stop-opacity="1"/></radialGradient></defs><g mask="url(#paint)">${shape}</g></svg>`);
}

function finishTexture(finish, pearlColor) {
  const texture = {
    gloss: '<linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop stop-color="white" stop-opacity=".52"/><stop offset=".4" stop-color="white" stop-opacity=".04"/><stop offset="1" stop-color="black" stop-opacity=".38"/></linearGradient><rect width="512" height="768" fill="url(#f)"/>',
    matte: '<rect width="512" height="768" fill="#777" opacity=".16"/>',
    'metallic-flake': '<pattern id="f" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#777" opacity=".12"/><circle cx="4" cy="5" r="1.3" fill="white" opacity=".72"/><circle cx="14" cy="12" r=".8" fill="white" opacity=".5"/></pattern><rect width="512" height="768" fill="url(#f)"/>',
    pearlescent: `<linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${pearlColor}" stop-opacity=".18"/><stop offset=".5" stop-color="white" stop-opacity=".55"/><stop offset="1" stop-color="#7DE2D1" stop-opacity=".4"/></linearGradient><rect width="512" height="768" fill="url(#f)"/>`,
    brushed: '<pattern id="f" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#777" opacity=".1"/><path d="M0 2H9M0 6H9" stroke="white" stroke-opacity=".34" stroke-width=".7"/></pattern><rect width="512" height="768" fill="url(#f)"/>',
    'carbon-weave': '<pattern id="f" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#252735"/><path d="M-4 4L4-4M0 16L16 0M12 20L20 12" stroke="#788099" stroke-width="5" opacity=".5"/></pattern><rect width="512" height="768" fill="url(#f)" opacity=".62"/>',
  }[finish];
  return Buffer.from(`<svg width="512" height="768" xmlns="http://www.w3.org/2000/svg">${texture}</svg>`);
}

async function maskedLayer(base, color, mask) {
  const channels = color.slice(1).match(/.{2}/g).map((part) => Number.parseInt(part, 16));
  const luminance = [0.2126, 0.7152, 0.0722];
  const tinted = await sharp(base)
    .recomb([luminance, luminance, luminance])
    .linear([0.58, 0.58, 0.58], channels.map((channel) => channel * 0.42))
    .png()
    .toBuffer();
  return sharp(tinted).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function validateOutput(file, label) {
  try {
    await access(file);
  } catch {
    throw new Error(`${label}: missing ${file}`);
  }
  const metadata = await sharp(file).metadata();
  if (metadata.width !== SIZE.width || metadata.height !== SIZE.height || !metadata.hasAlpha) {
    throw new Error(`${label}: expected a transparent 512x768 PNG`);
  }
  if ((await sharp(file).stats()).isOpaque) throw new Error(`${label}: alpha channel is fully opaque`);
}

async function renderPaint(model, recipe, output) {
  const base = path.resolve(model.root, model.sources.wood);
  const primaryMask = fullMask(model);
  const secondaryMask = accentMask(model, recipe.pattern);
  const primary = await maskedLayer(base, recipe.primary, primaryMask);
  const secondary = await maskedLayer(base, recipe.accent, secondaryMask);
  const rawPrimaryTexture = finishTexture(recipe.primaryFinish, recipe.accent);
  const primaryTexture = await sharp(rawPrimaryTexture)
    .composite([{ input: primaryMask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const rawSecondaryTexture = finishTexture(recipe.accentFinish, recipe.primary);
  const secondaryTexture = await sharp(rawSecondaryTexture)
    .composite([{ input: secondaryMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const composed = await sharp(base)
    .composite([
      { input: primary, blend: 'over' },
      { input: primaryTexture, blend: 'soft-light' },
      { input: secondary, blend: 'over' },
      { input: secondaryTexture, blend: 'overlay' },
    ])
    .png()
    .toBuffer();
  await sharp(composed)
    .composite([{ input: base, blend: 'dest-in' }])
    .png({ compressionLevel: 9, palette: true, quality: 95 })
    .toFile(output);
}

export async function runPaintSystem({ root, checkOnly = false, modelId, presetId } = {}) {
  const models = modelId ? GUITAR_MODEL_PIPELINE.filter((model) => model.id === modelId) : GUITAR_MODEL_PIPELINE;
  const presets = presetId ? PAINT_PRESETS.filter((preset) => preset.id === presetId) : PAINT_PRESETS;
  if (models.length === 0) throw new Error(`Unknown model: ${modelId}`);
  if (presets.length === 0) throw new Error(`Unknown paint preset: ${presetId}`);
  const outputDirectory = path.join(root, 'art', 'guitar-models', 'paint-previews');
  await mkdir(outputDirectory, { recursive: true });

  for (const preset of presets) validateRecipe(preset);
  for (const configuredModel of models) {
    const model = { ...configuredModel, root };
    for (const preset of presets) {
      const output = path.join(outputDirectory, `${model.id}--${preset.id}.png`);
      if (!checkOnly) await renderPaint(model, preset, output);
      await validateOutput(output, `${model.id}/${preset.id}`);
    }
  }
  console.log(`${checkOnly ? 'Validated' : 'Generated and validated'} ${models.length} models × ${presets.length} layered paint presets.`);
}
