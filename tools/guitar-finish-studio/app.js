(() => {
  'use strict';

  const WIDTH = 512;
  const HEIGHT = 768;
  const finishes = ['Gloss', 'Matte', 'Metallic Flake', 'Pearlescent', 'Brushed Metal', 'Carbon Weave'];
  const patterns = ['Center Stripe', 'Split', 'Edge Burst', 'Pinstripes', 'Diagonal Band', 'Chevron', 'Quarter Panels', 'No Accent'];
  const presets = [
    { name: 'Cherry Racing', primary: '#A51931', accent: '#FFD166', primaryFinish: 'Gloss', accentFinish: 'Metallic Flake', pattern: 'Center Stripe', seed: 1847 },
    { name: 'Aurora Pearl', primary: '#4568DC', accent: '#B06AB3', primaryFinish: 'Pearlescent', accentFinish: 'Gloss', pattern: 'Split', seed: 3901 },
    { name: 'Midnight Weave', primary: '#151827', accent: '#59D9FF', primaryFinish: 'Matte', accentFinish: 'Carbon Weave', pattern: 'Edge Burst', seed: 7712 },
    { name: 'Solar Flake', primary: '#D98516', accent: '#FFF0A1', primaryFinish: 'Metallic Flake', accentFinish: 'Gloss', pattern: 'Pinstripes', seed: 5521 },
    { name: 'Ocean Brushed', primary: '#145DA0', accent: '#7DE2D1', primaryFinish: 'Brushed Metal', accentFinish: 'Pearlescent', pattern: 'Center Stripe', seed: 9320 },
    { name: 'Forest Carbon', primary: '#176B45', accent: '#B8FF55', primaryFinish: 'Carbon Weave', accentFinish: 'Matte', pattern: 'Diagonal Band', seed: 2638 },
  ];

  const el = (id) => document.getElementById(id);
  const canvas = el('preview');
  const ctx = canvas.getContext('2d', { alpha: true });
  const source = document.createElement('canvas');
  const mask = document.createElement('canvas');
  const work = document.createElement('canvas');
  [source, mask, work].forEach((item) => { item.width = WIDTH; item.height = HEIGHT; });
  const sourceCtx = source.getContext('2d', { willReadFrequently: true });
  const maskCtx = mask.getContext('2d', { willReadFrequently: true });
  const workCtx = work.getContext('2d', { willReadFrequently: true });
  let brushMode = 'off';
  let drawing = false;
  let lastPoint = null;
  let undoStack = [];
  let sourceKind = 'sample';
  let batchResults = [];

  const controls = {
    primary: el('primary-color'), accent: el('accent-color'), primaryFinish: el('primary-finish'),
    accentFinish: el('accent-finish'), pattern: el('pattern'), strength: el('texture-strength'),
    scale: el('pattern-scale'), seed: el('seed'), preset: el('preset'), showMask: el('show-mask'),
  };

  function optionList(select, values) {
    select.replaceChildren(...values.map((value) => new Option(value, value)));
  }

  function setStatus(message, error = false) {
    el('status').textContent = message;
    el('status').classList.toggle('error', error);
  }

  function hexToRgb(hex) {
    const value = Number.parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function rng(seed) {
    let value = Math.max(1, Number(seed) || 1) >>> 0;
    return () => {
      value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      return (value >>> 0) / 4294967296;
    };
  }

  function path(value) { return new Path2D(value); }

  function drawSample(kind) {
    sourceCtx.clearRect(0, 0, WIDTH, HEIGHT);
    const isAcoustic = kind === 'acoustic';
    const bodyPath = isAcoustic
      ? path('M184 379C154 379 148 415 156 458C164 499 123 540 115 610C108 684 161 730 256 739C351 730 402 682 392 610C384 552 346 506 351 468C358 432 343 410 315 410C292 410 284 394 276 379Z')
      : path('M187 418C156 413 148 451 151 504C154 552 128 600 133 662C138 718 184 739 259 742C338 739 382 713 384 660C387 598 364 548 366 504C369 470 356 444 335 449C307 456 297 485 271 490H253C233 466 215 425 187 418Z');
    const headPath = isAcoustic
      ? path('M224 18C242 10 273 10 290 20L298 119C297 132 286 139 276 143H238C228 139 217 132 216 119Z')
      : path('M274 7C282 10 286 18 285 29L283 108L271 136H236L230 119C242 99 254 49 274 7Z');
    const wood = sourceCtx.createLinearGradient(120, 380, 390, 730);
    wood.addColorStop(0, isAcoustic ? '#d79b54' : '#732536');
    wood.addColorStop(.5, isAcoustic ? '#9d552c' : '#bc5a63');
    wood.addColorStop(1, isAcoustic ? '#6c341f' : '#471522');
    sourceCtx.fillStyle = wood; sourceCtx.fill(bodyPath);
    sourceCtx.strokeStyle = '#e7b86f'; sourceCtx.lineWidth = 6; sourceCtx.stroke(bodyPath);
    sourceCtx.fillStyle = '#5c2c20'; sourceCtx.fill(headPath);
    sourceCtx.fillStyle = '#3b231d'; sourceCtx.fillRect(238, 125, 38, isAcoustic ? 380 : 390);
    sourceCtx.fillStyle = '#d4c9ab';
    for (let y = 155; y < 490; y += 27) sourceCtx.fillRect(239, y, 36, 2);
    if (isAcoustic) {
      sourceCtx.fillStyle = '#17100d'; sourceCtx.beginPath(); sourceCtx.arc(256, 494, 41, 0, Math.PI * 2); sourceCtx.fill();
      sourceCtx.strokeStyle = '#e5bd78'; sourceCtx.lineWidth = 5; sourceCtx.beginPath(); sourceCtx.arc(256, 494, 48, 0, Math.PI * 2); sourceCtx.stroke();
      sourceCtx.fillStyle = '#352018'; sourceCtx.roundRect(207, 585, 100, 27, 7); sourceCtx.fill();
    } else {
      sourceCtx.fillStyle = '#e3d8bd'; sourceCtx.roundRect(227, 496, 61, 36, 5); sourceCtx.fill(); sourceCtx.roundRect(227, 570, 61, 36, 5); sourceCtx.fill();
      sourceCtx.fillStyle = '#b5a88b'; sourceCtx.roundRect(229, 615, 58, 29, 4); sourceCtx.fill();
      sourceCtx.fillStyle = '#e9c86c'; [[331,599,10],[350,635,7],[332,669,10]].forEach(([x,y,r]) => { sourceCtx.beginPath(); sourceCtx.arc(x,y,r,0,Math.PI*2); sourceCtx.fill(); });
    }
    sourceCtx.strokeStyle = '#eee8d8'; sourceCtx.lineWidth = .9;
    for (let x = 249; x <= 264; x += 3) { sourceCtx.beginPath(); sourceCtx.moveTo(x, 35); sourceCtx.lineTo(x, 610); sourceCtx.stroke(); }
    sourceCtx.fillStyle = '#c7b786';
    for (let index = 0; index < 6; index += 1) {
      const x = isAcoustic ? (index % 2 ? 277 : 237) : 244 + (index * 5);
      const y = isAcoustic ? 52 + Math.floor(index / 2) * 33 : 34 + index * 16;
      sourceCtx.beginPath(); sourceCtx.arc(x, y, 7, 0, Math.PI * 2); sourceCtx.fill();
    }
    sourceCtx.fillStyle = '#fff4'; sourceCtx.fill(path(isAcoustic ? 'M165 450C145 610 180 700 225 720C180 650 190 520 220 410Z' : 'M165 470C150 620 190 700 225 720C190 620 205 520 230 440Z'));

    maskCtx.clearRect(0, 0, WIDTH, HEIGHT);
    maskCtx.fillStyle = '#fff'; maskCtx.fill(bodyPath); maskCtx.fill(headPath);
    if (isAcoustic) {
      maskCtx.globalCompositeOperation = 'destination-out';
      maskCtx.beginPath(); maskCtx.arc(256, 494, 49, 0, Math.PI * 2); maskCtx.fill();
      maskCtx.fillRect(202, 580, 110, 38); maskCtx.fillRect(236, 125, 42, 385);
    } else {
      maskCtx.globalCompositeOperation = 'destination-out';
      maskCtx.fillRect(238, 240, 46, 272); maskCtx.fillRect(222, 490, 72, 123); maskCtx.fillRect(223, 610, 70, 42);
      [[331,599,14],[350,635,11],[332,669,14]].forEach(([x,y,r]) => { maskCtx.beginPath(); maskCtx.arc(x,y,r,0,Math.PI*2); maskCtx.fill(); });
    }
    maskCtx.globalCompositeOperation = 'source-over';
    sourceKind = 'sample';
    el('source-name').textContent = `Built-in ${kind} sample`;
    el('dimensions').textContent = '512 × 768 canvas';
    undoStack = []; updateUndo(); render();
  }

  function autoMask({ clearHistory = true } = {}) {
    const data = sourceCtx.getImageData(0, 0, WIDTH, HEIGHT);
    const next = maskCtx.createImageData(WIDTH, HEIGHT);
    for (let i = 0; i < data.data.length; i += 4) {
      next.data[i] = 255; next.data[i + 1] = 255; next.data[i + 2] = 255; next.data[i + 3] = data.data[i + 3];
    }
    maskCtx.putImageData(next, 0, 0);
    if (clearHistory) undoStack = [];
    updateUndo(); render();
  }

  function accentMask(pattern, scale, paintMask = mask) {
    const result = document.createElement('canvas'); result.width = WIDTH; result.height = HEIGHT;
    const rctx = result.getContext('2d');
    const s = scale / 100;
    rctx.fillStyle = '#fff';
    if (pattern === 'No Accent') return result;
    if (pattern === 'Center Stripe') rctx.fillRect(256 - 31 * s, 0, 62 * s, HEIGHT);
    if (pattern === 'Split') rctx.fillRect(256, 0, 256, HEIGHT);
    if (pattern === 'Pinstripes') { rctx.fillRect(221 - 5 * s, 0, 11 * s, HEIGHT); rctx.fillRect(280 - 5 * s, 0, 11 * s, HEIGHT); }
    if (pattern === 'Diagonal Band') { rctx.save(); rctx.translate(256, 384); rctx.rotate(-.35); rctx.fillRect(-55 * s, -500, 110 * s, 1000); rctx.restore(); }
    if (pattern === 'Chevron') { rctx.lineWidth = 38 * s; rctx.strokeStyle = '#fff'; rctx.beginPath(); rctx.moveTo(130, 520); rctx.lineTo(256, 640); rctx.lineTo(382, 520); rctx.stroke(); }
    if (pattern === 'Quarter Panels') { rctx.fillRect(0, 0, 256, 384); rctx.fillRect(256, 384, 256, 384); }
    if (pattern === 'Edge Burst') {
      const gradient = rctx.createRadialGradient(256, 520, 90 / s, 256, 520, 330 / s);
      gradient.addColorStop(0, '#0000'); gradient.addColorStop(.58, '#0000'); gradient.addColorStop(1, '#fff');
      rctx.fillStyle = gradient; rctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    rctx.globalCompositeOperation = 'destination-in'; rctx.drawImage(paintMask, 0, 0);
    return result;
  }

  function drawFinish(target, finish, strength, seed, layerMask) {
    if (strength <= 0) return;
    const opacity = strength / 100;
    const random = rng(seed + finishes.indexOf(finish) * 101);
    target.save(); target.globalAlpha = opacity;
    if (finish === 'Gloss') {
      const shine = target.createLinearGradient(110, 120, 410, 680); shine.addColorStop(0, '#fff9'); shine.addColorStop(.35, '#fff0'); shine.addColorStop(1, '#0008');
      target.fillStyle = shine; target.fillRect(0, 0, WIDTH, HEIGHT);
    } else if (finish === 'Matte') {
      target.fillStyle = '#7774'; target.fillRect(0, 0, WIDTH, HEIGHT);
    } else if (finish === 'Metallic Flake') {
      target.fillStyle = '#fff';
      for (let i = 0; i < 1600; i += 1) { const size = .4 + random() * 1.6; target.globalAlpha = opacity * (.15 + random() * .7); target.fillRect(random() * WIDTH, random() * HEIGHT, size, size); }
    } else if (finish === 'Pearlescent') {
      const pearl = target.createLinearGradient(0, 160, WIDTH, 650); pearl.addColorStop(0, '#ffb5ed99'); pearl.addColorStop(.5, '#ffffff88'); pearl.addColorStop(1, '#7de2d199');
      target.globalAlpha = opacity; target.fillStyle = pearl; target.fillRect(0, 0, WIDTH, HEIGHT);
    } else if (finish === 'Brushed Metal') {
      target.strokeStyle = '#fff'; target.lineWidth = .65;
      for (let y = 0; y < HEIGHT; y += 4 + random() * 5) { target.globalAlpha = opacity * (.15 + random() * .35); target.beginPath(); target.moveTo(0, y); target.lineTo(WIDTH, y + random() * 2); target.stroke(); }
    } else if (finish === 'Carbon Weave') {
      target.strokeStyle = '#b9c1d0'; target.lineWidth = 4;
      for (let offset = -HEIGHT; offset < WIDTH + HEIGHT; offset += 14) { target.globalAlpha = opacity * .25; target.beginPath(); target.moveTo(offset, 0); target.lineTo(offset + HEIGHT, HEIGHT); target.stroke(); target.beginPath(); target.moveTo(offset + HEIGHT, 0); target.lineTo(offset, HEIGHT); target.stroke(); }
    }
    target.globalAlpha = 1; target.globalCompositeOperation = 'destination-in'; target.drawImage(layerMask, 0, 0); target.restore();
  }

  function tintedLayer(color, layerMask, finish, seed, strength) {
    const base = sourceCtx.getImageData(0, 0, WIDTH, HEIGHT);
    const maskData = layerMask.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT).data;
    const output = workCtx.createImageData(WIDTH, HEIGHT);
    const [red, green, blue] = hexToRgb(color);
    for (let i = 0; i < base.data.length; i += 4) {
      const alpha = (base.data[i + 3] * maskData[i + 3]) / 255;
      if (!alpha) continue;
      const light = base.data[i] * .2126 + base.data[i + 1] * .7152 + base.data[i + 2] * .0722;
      output.data[i] = Math.min(255, light * .58 + red * .42);
      output.data[i + 1] = Math.min(255, light * .58 + green * .42);
      output.data[i + 2] = Math.min(255, light * .58 + blue * .42);
      output.data[i + 3] = alpha;
    }
    const layer = document.createElement('canvas'); layer.width = WIDTH; layer.height = HEIGHT;
    const layerCtx = layer.getContext('2d'); layerCtx.putImageData(output, 0, 0);
    const texture = document.createElement('canvas'); texture.width = WIDTH; texture.height = HEIGHT;
    drawFinish(texture.getContext('2d'), finish, Number(strength), Number(seed), layerMask);
    layerCtx.globalCompositeOperation = finish === 'Matte' ? 'soft-light' : 'overlay'; layerCtx.drawImage(texture, 0, 0);
    return layer;
  }

  function renderDesign(target, design, showMask = false) {
    const targetCtx = target.getContext('2d');
    targetCtx.clearRect(0, 0, WIDTH, HEIGHT); targetCtx.globalCompositeOperation = 'source-over'; targetCtx.drawImage(source, 0, 0);
    targetCtx.drawImage(tintedLayer(design.primary, mask, design.primaryFinish, design.seed, design.textureStrength), 0, 0);
    const accent = accentMask(design.pattern, design.patternScale);
    if (design.pattern !== 'No Accent') targetCtx.drawImage(tintedLayer(design.accent, accent, design.accentFinish, design.seed + 17, design.textureStrength), 0, 0);
    targetCtx.globalCompositeOperation = 'destination-in'; targetCtx.drawImage(source, 0, 0); targetCtx.globalCompositeOperation = 'source-over';
    if (showMask) {
      targetCtx.save(); targetCtx.globalAlpha = .32; targetCtx.globalCompositeOperation = 'screen'; targetCtx.drawImage(mask, 0, 0); targetCtx.restore();
    }
  }

  function render() {
    renderDesign(canvas, recipe(), controls.showMask.checked || brushMode !== 'off');
    el('primary-hex').textContent = controls.primary.value.toUpperCase();
    el('accent-hex').textContent = controls.accent.value.toUpperCase();
    el('texture-value').textContent = `${controls.strength.value}%`;
    el('pattern-value').textContent = `${controls.scale.value}%`;
  }

  function applyPreset(index) {
    const value = presets[index]; if (!value) return;
    controls.preset.value = String(index);
    controls.primary.value = value.primary; controls.accent.value = value.accent;
    controls.primaryFinish.value = value.primaryFinish; controls.accentFinish.value = value.accentFinish;
    controls.pattern.value = value.pattern; controls.seed.value = value.seed; render();
    setStatus(`${value.name} applied.`);
  }

  async function loadBitmap(file, target, fit = true) {
    const bitmap = await createImageBitmap(file);
    const targetCtx = target.getContext('2d'); targetCtx.clearRect(0, 0, WIDTH, HEIGHT);
    if (fit) {
      const scale = Math.min(WIDTH / bitmap.width, HEIGHT / bitmap.height);
      const width = bitmap.width * scale; const height = bitmap.height * scale;
      targetCtx.drawImage(bitmap, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
    } else targetCtx.drawImage(bitmap, 0, 0, WIDTH, HEIGHT);
    bitmap.close();
  }

  async function importSource(file) {
    if (!file || !/^image\/(png|webp)$/.test(file.type)) return setStatus('Choose a PNG or WebP image.', true);
    try {
      await loadBitmap(file, source); sourceKind = 'import'; autoMask();
      el('source-name').textContent = file.name;
      el('dimensions').textContent = `${WIDTH} × ${HEIGHT} working canvas`;
      setStatus('Imported. Use Protect mode to brush over hardware before exporting.');
    } catch { setStatus('That image could not be opened. Try another PNG or WebP.', true); }
  }

  async function importMask(file) {
    try {
      const temp = document.createElement('canvas'); temp.width = WIDTH; temp.height = HEIGHT; await loadBitmap(file, temp, false);
      const pixels = temp.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT); const output = maskCtx.createImageData(WIDTH, HEIGHT);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const brightness = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
        const alpha = pixels.data[i + 3] * brightness / 255;
        output.data[i] = 255; output.data[i + 1] = 255; output.data[i + 2] = 255; output.data[i + 3] = alpha;
      }
      pushUndo(); maskCtx.putImageData(output, 0, 0); render(); setStatus('Mask imported. White areas can be painted; black or transparent areas are protected.');
    } catch { setStatus('That mask could not be opened.', true); }
  }

  function pushUndo() { undoStack.push(maskCtx.getImageData(0, 0, WIDTH, HEIGHT)); if (undoStack.length > 12) undoStack.shift(); updateUndo(); }
  function updateUndo() { el('undo-mask').disabled = undoStack.length === 0; }
  function undo() { const previous = undoStack.pop(); if (previous) { maskCtx.putImageData(previous, 0, 0); updateUndo(); render(); setStatus('Mask edit undone.'); } }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * WIDTH / rect.width, y: (event.clientY - rect.top) * HEIGHT / rect.height };
  }

  function paintBetween(from, to) {
    const size = Number(el('brush-size').value);
    maskCtx.save(); maskCtx.lineCap = 'round'; maskCtx.lineJoin = 'round'; maskCtx.lineWidth = size;
    maskCtx.globalCompositeOperation = brushMode === 'protect' ? 'destination-out' : 'source-over'; maskCtx.strokeStyle = '#fff';
    maskCtx.beginPath(); maskCtx.moveTo(from.x, from.y); maskCtx.lineTo(to.x, to.y); maskCtx.stroke(); maskCtx.restore(); render();
  }

  function downloadCanvas(target, filename) {
    target.toBlob((blob) => {
      if (!blob) return setStatus('This browser could not create the PNG.', true);
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setStatus(`${filename} downloaded.`);
    }, 'image/png');
  }

  function recipe() {
    return { format: 'guitar-finish-studio', version: 1, primary: controls.primary.value, accent: controls.accent.value, primaryFinish: controls.primaryFinish.value, accentFinish: controls.accentFinish.value, pattern: controls.pattern.value, textureStrength: Number(controls.strength.value), patternScale: Number(controls.scale.value), seed: Number(controls.seed.value) };
  }

  function rgbToHsl([red, green, blue]) {
    const r = red / 255; const g = green / 255; const b = blue / 255;
    const max = Math.max(r, g, b); const min = Math.min(r, g, b); const delta = max - min;
    let hue = 0;
    if (delta) hue = max === r ? 60 * (((g - b) / delta) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
    const light = (max + min) / 2;
    const saturation = delta ? delta / (1 - Math.abs(2 * light - 1)) : 0;
    return [(hue + 360) % 360, saturation * 100, light * 100];
  }

  function colorContrast(first, second) {
    const luminance = (hex) => {
      const channels = hexToRgb(hex).map((value) => { const channel = value / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const a = luminance(first); const b = luminance(second); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  }

  function batchRules() {
    return {
      format: 'guitar-finish-studio-batch', version: 1, colorRule: el('batch-color-rule').value,
      finishRule: el('batch-finish-rule').value, patternRule: el('batch-pattern-rule').value,
      count: Math.max(2, Math.min(36, Number(el('batch-count').value) || 12)),
      seed: Math.max(1, Math.min(999999, Number(el('batch-seed').value) || 1)),
      keepDistinct: el('batch-contrast').checked, basePrimary: controls.primary.value, baseAccent: controls.accent.value,
      textureStrength: Number(controls.strength.value), patternScale: Number(controls.scale.value),
    };
  }

  function buildBatch(rules) {
    const random = rng(rules.seed);
    const [baseHue, baseSaturation, baseLight] = rgbToHsl(hexToRgb(rules.basePrimary));
    const curated = ['#A51931','#FFD166','#4568DC','#B06AB3','#145DA0','#7DE2D1','#176B45','#B8FF55','#D98516','#59D9FF'];
    const finishSets = {
      balanced: [['Gloss','Metallic Flake'],['Matte','Gloss'],['Pearlescent','Gloss'],['Brushed Metal','Matte'],['Carbon Weave','Pearlescent']],
      glossy: [['Gloss','Gloss'],['Pearlescent','Gloss'],['Gloss','Metallic Flake']],
      textured: [['Brushed Metal','Carbon Weave'],['Carbon Weave','Matte'],['Metallic Flake','Pearlescent']],
      mixed: finishes.flatMap((primary) => finishes.map((accent) => [primary, accent])),
    };
    const patternSets = {
      all: patterns.slice(0, -1), stripes: ['Center Stripe','Pinstripes','Diagonal Band'],
      bold: ['Split','Chevron','Quarter Panels'], subtle: ['Edge Burst','Pinstripes','No Accent'],
    };
    const chosenFinishes = finishSets[rules.finishRule]; const chosenPatterns = patternSets[rules.patternRule];
    const results = []; const seen = new Set(); let attempts = 0;
    while (results.length < rules.count && attempts < rules.count * 20) {
      const index = attempts++; const jitter = (random() - .5) * 20;
      let primary; let accent;
      if (rules.colorRule === 'curated') {
        primary = curated[(index + Math.floor(random() * curated.length)) % curated.length];
        accent = curated[(index * 3 + 1) % curated.length];
      } else if (rules.colorRule === 'monochrome') {
        primary = hslHex(baseHue + jitter, Math.max(30, baseSaturation), 26 + random() * 22);
        accent = hslHex(baseHue - jitter, Math.max(25, baseSaturation - 15), 64 + random() * 22);
      } else {
        const shift = rules.colorRule === 'complementary' ? 180 : rules.colorRule === 'triadic' ? (index % 2 ? 120 : 240) : (index % 2 ? 34 : -34);
        primary = hslHex(baseHue + jitter, Math.max(42, baseSaturation), Math.max(26, Math.min(58, baseLight + (random() - .5) * 18)));
        accent = hslHex(baseHue + shift - jitter, 62 + random() * 24, 52 + random() * 24);
      }
      if (rules.keepDistinct && colorContrast(primary, accent) < 3) {
        const primaryLight = rgbToHsl(hexToRgb(primary))[2]; const accentHsl = rgbToHsl(hexToRgb(accent));
        accent = hslHex(accentHsl[0], Math.max(58, accentHsl[1]), primaryLight > 50 ? 18 : 84);
      }
      const finishPair = chosenFinishes[(index + Math.floor(random() * chosenFinishes.length)) % chosenFinishes.length];
      const pattern = chosenPatterns[(index + Math.floor(random() * chosenPatterns.length)) % chosenPatterns.length];
      const result = { format: 'guitar-finish-studio', version: 1, primary, accent, primaryFinish: finishPair[0], accentFinish: finishPair[1], pattern, textureStrength: rules.textureStrength, patternScale: rules.patternScale, seed: Math.floor(1 + random() * 999998) };
      const key = [primary, accent, ...finishPair, pattern].join('|');
      if (!seen.has(key)) { seen.add(key); results.push(result); }
    }
    return results;
  }

  async function generateBatch() {
    const button = el('generate-batch'); button.disabled = true; el('export-batch').disabled = true;
    const rules = batchRules(); el('batch-count').value = String(rules.count); el('batch-seed').value = String(rules.seed);
    el('batch-status').textContent = 'Building rule-based collection…';
    await new Promise((resolve) => requestAnimationFrame(resolve));
    batchResults = buildBatch(rules); const gallery = el('batch-gallery'); gallery.replaceChildren();
    batchResults.forEach((design, index) => {
      const item = document.createElement('div'); item.className = 'batch-item';
      const preview = document.createElement('canvas'); preview.width = WIDTH; preview.height = HEIGHT; renderDesign(preview, design);
      const label = document.createElement('span'); label.textContent = `${String(index + 1).padStart(2, '0')} · ${design.pattern}`; label.title = `${design.primary} + ${design.accent}, ${design.primaryFinish} / ${design.accentFinish}`;
      item.append(preview, label); gallery.append(item);
    });
    el('batch-status').textContent = `${batchResults.length} unique designs ready. Seed ${rules.seed}.`;
    el('export-batch').disabled = batchResults.length === 0; button.disabled = false;
  }

  function canvasBlob(target) {
    return new Promise((resolve, reject) => target.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
  }

  const crcTable = Array.from({ length: 256 }, (_, value) => {
    let crc = value; for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xEDB88320 ^ (crc >>> 1) : crc >>> 1; return crc >>> 0;
  });

  function crc32(bytes) {
    let crc = 0xFFFFFFFF; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8); return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function zipHeader(size, writer) {
    const bytes = new Uint8Array(size); writer(new DataView(bytes.buffer)); return bytes;
  }

  function storeZip(entries) {
    const encoder = new TextEncoder(); const localParts = []; const centralParts = []; let offset = 0; let centralSize = 0;
    entries.forEach((entry) => {
      const name = encoder.encode(entry.name); const checksum = crc32(entry.data);
      const local = zipHeader(30 + name.length, (view) => {
        view.setUint32(0, 0x04034B50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x0800, true); view.setUint16(8, 0, true);
        view.setUint16(10, 0, true); view.setUint16(12, 33, true); view.setUint32(14, checksum, true); view.setUint32(18, entry.data.length, true);
        view.setUint32(22, entry.data.length, true); view.setUint16(26, name.length, true); view.setUint16(28, 0, true); new Uint8Array(view.buffer).set(name, 30);
      });
      const central = zipHeader(46 + name.length, (view) => {
        view.setUint32(0, 0x02014B50, true); view.setUint16(4, 20, true); view.setUint16(6, 20, true); view.setUint16(8, 0x0800, true);
        view.setUint16(10, 0, true); view.setUint16(12, 0, true); view.setUint16(14, 33, true); view.setUint32(16, checksum, true);
        view.setUint32(20, entry.data.length, true); view.setUint32(24, entry.data.length, true); view.setUint16(28, name.length, true);
        view.setUint16(30, 0, true); view.setUint16(32, 0, true); view.setUint16(34, 0, true); view.setUint16(36, 0, true);
        view.setUint32(38, 0, true); view.setUint32(42, offset, true); new Uint8Array(view.buffer).set(name, 46);
      });
      localParts.push(local, entry.data); centralParts.push(central); offset += local.length + entry.data.length; centralSize += central.length;
    });
    const end = zipHeader(22, (view) => { view.setUint32(0, 0x06054B50, true); view.setUint16(4, 0, true); view.setUint16(6, 0, true); view.setUint16(8, entries.length, true); view.setUint16(10, entries.length, true); view.setUint32(12, centralSize, true); view.setUint32(16, offset, true); view.setUint16(20, 0, true); });
    return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
  }

  async function exportBatch() {
    if (!batchResults.length) return;
    const button = el('export-batch'); button.disabled = true; const entries = [];
    try {
      for (let index = 0; index < batchResults.length; index += 1) {
        el('batch-status').textContent = `Rendering ${index + 1} of ${batchResults.length}…`;
        const output = document.createElement('canvas'); output.width = WIDTH; output.height = HEIGHT; renderDesign(output, batchResults[index]);
        entries.push({ name: `designs/guitar-finish-${String(index + 1).padStart(2, '0')}.png`, data: new Uint8Array(await (await canvasBlob(output)).arrayBuffer()) });
        if (index % 4 === 3) await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      const manifest = { format: 'guitar-finish-studio-collection', version: 1, createdBy: 'Guitar Finish Studio', rules: batchRules(), designs: batchResults };
      entries.push({ name: 'manifest.json', data: new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`) });
      const blob = storeZip(entries); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `guitar-finish-batch-${batchRules().seed}.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      el('batch-status').textContent = `${batchResults.length} PNGs and manifest downloaded as one ZIP.`;
    } catch { el('batch-status').textContent = 'The batch could not be exported. Try a smaller collection.'; }
    button.disabled = false;
  }

  function downloadRecipe() {
    const blob = new Blob([`${JSON.stringify(recipe(), null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'guitar-finish-recipe.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Recipe downloaded.');
  }

  async function loadRecipe(file) {
    try {
      const value = JSON.parse(await file.text());
      if (value.format !== 'guitar-finish-studio' || value.version !== 1) throw new Error('format');
      if (!/^#[0-9a-f]{6}$/i.test(value.primary) || !/^#[0-9a-f]{6}$/i.test(value.accent)) throw new Error('color');
      if (!finishes.includes(value.primaryFinish) || !finishes.includes(value.accentFinish) || !patterns.includes(value.pattern)) throw new Error('choice');
      controls.primary.value = value.primary; controls.accent.value = value.accent; controls.primaryFinish.value = value.primaryFinish;
      controls.accentFinish.value = value.accentFinish; controls.pattern.value = value.pattern;
      controls.strength.value = Math.max(0, Math.min(100, Number(value.textureStrength) || 0));
      controls.scale.value = Math.max(50, Math.min(180, Number(value.patternScale) || 100));
      controls.seed.value = Math.max(1, Math.min(999999, Number(value.seed) || 1)); render(); setStatus('Recipe loaded.');
    } catch { setStatus('That is not a valid Guitar Finish Studio recipe.', true); }
  }

  optionList(controls.primaryFinish, finishes); optionList(controls.accentFinish, finishes); optionList(controls.pattern, patterns);
  controls.preset.replaceChildren(new Option('Custom', 'custom'), ...presets.map((value, index) => new Option(value.name, String(index))));
  Object.values(controls).filter((value) => value instanceof HTMLElement && !['preset', 'show-mask'].includes(value.id)).forEach((control) => control.addEventListener('input', () => { controls.preset.value = 'custom'; render(); }));
  controls.showMask.addEventListener('input', render);
  controls.preset.addEventListener('change', () => { if (controls.preset.value !== 'custom') applyPreset(Number(controls.preset.value)); });
  el('sample-model').addEventListener('change', (event) => { drawSample(event.target.value); setStatus(`Built-in ${event.target.value} sample loaded.`); });
  el('source-file').addEventListener('change', (event) => importSource(event.target.files[0]));
  el('mask-file').addEventListener('change', (event) => importMask(event.target.files[0]));
  el('recipe-file').addEventListener('change', (event) => loadRecipe(event.target.files[0]));
  el('swap-colors').addEventListener('click', () => { const value = controls.primary.value; controls.primary.value = controls.accent.value; controls.accent.value = value; render(); setStatus('Primary and accent colors swapped.'); });
  el('randomize').addEventListener('click', () => {
    const hue = Math.floor(Math.random() * 360); controls.preset.value = 'custom'; controls.primary.value = hslHex(hue, 62, 38); controls.accent.value = hslHex((hue + 80 + Math.random() * 200) % 360, 78, 64);
    controls.primaryFinish.value = finishes[Math.floor(Math.random() * finishes.length)]; controls.accentFinish.value = finishes[Math.floor(Math.random() * finishes.length)];
    controls.pattern.value = patterns[Math.floor(Math.random() * (patterns.length - 1))]; controls.seed.value = Math.floor(1 + Math.random() * 999998); render(); setStatus('New original combination generated.');
  });
  function hslHex(h, s, l) { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs((h / 60) % 2 - 1)); const m = l - c / 2; const rgb = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x]; return `#${rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2,'0')).join('')}`; }
  document.querySelectorAll('[data-brush]').forEach((button) => button.addEventListener('click', () => {
    brushMode = button.dataset.brush; document.querySelectorAll('[data-brush]').forEach((item) => item.classList.toggle('active', item === button));
    canvas.classList.toggle('editing', brushMode !== 'off'); controls.showMask.checked = brushMode !== 'off'; render();
    setStatus(brushMode === 'protect' ? 'Protect brush active: paint over hardware to exclude it.' : brushMode === 'paint' ? 'Paint brush active: restore areas that should accept paint.' : 'Preview mode active.');
  }));
  canvas.addEventListener('pointerdown', (event) => { if (brushMode === 'off') return; event.preventDefault(); pushUndo(); drawing = true; lastPoint = canvasPoint(event); canvas.setPointerCapture(event.pointerId); paintBetween(lastPoint, lastPoint); });
  canvas.addEventListener('pointermove', (event) => { if (!drawing) return; const next = canvasPoint(event); paintBetween(lastPoint, next); lastPoint = next; });
  canvas.addEventListener('pointerup', () => { drawing = false; lastPoint = null; setStatus('Mask updated.'); });
  canvas.addEventListener('pointercancel', () => { drawing = false; lastPoint = null; });
  el('undo-mask').addEventListener('click', undo);
  el('reset-mask').addEventListener('click', () => { pushUndo(); autoMask({ clearHistory: false }); setStatus('All visible pixels selected. Protect hardware before exporting.'); });
  el('export-mask').addEventListener('click', () => downloadCanvas(mask, 'guitar-paint-mask.png'));
  el('export-png').addEventListener('click', () => { const show = controls.showMask.checked; controls.showMask.checked = false; const mode = brushMode; brushMode = 'off'; render(); downloadCanvas(canvas, 'custom-guitar-finish.png'); brushMode = mode; controls.showMask.checked = show; render(); });
  el('save-recipe').addEventListener('click', downloadRecipe);
  el('reset-all').addEventListener('click', () => { controls.preset.value = '0'; applyPreset(0); drawSample(el('sample-model').value); setStatus('Design reset.'); });
  el('brush-size').addEventListener('input', () => { el('brush-value').textContent = `${el('brush-size').value} px`; });
  el('generate-batch').addEventListener('click', generateBatch);
  el('export-batch').addEventListener('click', exportBatch);
  document.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); } });
  ['dragenter','dragover'].forEach((name) => canvas.parentElement.addEventListener(name, (event) => { event.preventDefault(); el('drop-hint').hidden = false; }));
  ['dragleave','drop'].forEach((name) => canvas.parentElement.addEventListener(name, (event) => { event.preventDefault(); el('drop-hint').hidden = true; }));
  canvas.parentElement.addEventListener('drop', (event) => importSource(event.dataTransfer.files[0]));

  applyPreset(0); drawSample('acoustic');
})();
