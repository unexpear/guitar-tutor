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
  const meshBlueprints = {
    'steel-acoustic': { profile: 'acoustic-dreadnought', strings: 6, scale: 645.2, frets: 20, nutWidth: 44.5, bridgeSpacing: 54.8, depth: 10, pickups: 'none', joinFret: 14, note: '25.4 in scale · 20 frets · neck joins at fret 14' },
    'longscale-electric': { profile: 'electric-doublecut', strings: 6, scale: 648, frets: 22, nutWidth: 42.8, bridgeSpacing: 52.4, depth: 4.5, pickups: 'sss', joinFret: 17, note: '25.5 in scale · 22 frets · three single-coil layout' },
    'shortscale-electric': { profile: 'electric-singlecut', strings: 6, scale: 628.7, frets: 22, nutWidth: 42.9, bridgeSpacing: 52, depth: 5, pickups: 'hh', joinFret: 16, note: '24.75 in scale · 22 frets · two humbucker layout' },
    'longscale-bass': { profile: 'bass-doublecut', strings: 4, scale: 864, frets: 20, nutWidth: 41.3, bridgeSpacing: 57, depth: 4.5, pickups: 'p', joinFret: 16, note: '34 in scale · 20 frets · split-coil pickup' },
  };

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
  let sourceRequest = 0;
  let batchResults = [];
  let generatedRules = null;
  let generatedConstruction = null;
  let review = null;
  let meshUpdateTimer;
  let meshProfile = 'acoustic';

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
    sourceRequest++;
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
    meshProfile = isAcoustic ? 'acoustic-dreadnought' : 'electric-singlecut';
    applyMeshBlueprint(isAcoustic ? 'steel-acoustic' : 'shortscale-electric');
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

  function applyKnownPhotoMask(filename) {
    const normalized = filename.toLowerCase();
    const profile = normalized.includes('acoustic-cutaway') ? 'acoustic' : normalized.includes('electric-singlecut') ? 'electric' : null;
    if (!profile) return false;
    // Follow the photo's actual silhouette, not the illustrated demo outline.
    // A small inset keeps its edge/binding intact; hardware is protected below.
    const pixels = sourceCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
    const fitted = maskCtx.createImageData(WIDTH, HEIGHT);
    const bodyTop = profile === 'acoustic' ? 374 : 414;
    for (let y = 2; y < HEIGHT - 2; y++) for (let x = 2; x < WIDTH - 2; x++) {
      if (y > 136 && y < bodyTop) continue;
      const i = (y * WIDTH + x) * 4;
      if ([i, i - 8, i + 8, i - WIDTH * 8, i + WIDTH * 8].some((offset) => pixels[offset + 3] < 200)) continue;
      fitted.data[i] = fitted.data[i + 1] = fitted.data[i + 2] = fitted.data[i + 3] = 255;
    }
    maskCtx.putImageData(fitted, 0, 0); maskCtx.fillStyle = '#fff';
    maskCtx.globalCompositeOperation = 'destination-out';
    if (profile === 'acoustic') {
      maskCtx.fillRect(237, 132, 42, 365); maskCtx.beginPath(); maskCtx.arc(256, 494, 41, 0, Math.PI * 2); maskCtx.fill(); maskCtx.roundRect(207, 585, 100, 27, 7); maskCtx.fill();
      [[239,55],[274,55],[239,88],[274,88],[239,121],[274,121]].forEach(([x,y]) => { maskCtx.beginPath(); maskCtx.arc(x,y,8,0,Math.PI*2); maskCtx.fill(); });
      [[218,55],[287,55],[218,80],[287,80],[220,104],[287,104]].forEach(([x,y]) => { maskCtx.beginPath(); maskCtx.arc(x,y,10,0,Math.PI*2); maskCtx.fill(); });
    } else {
      maskCtx.fillRect(241, 245, 42, 260); maskCtx.roundRect(227, 496, 61, 36, 5); maskCtx.fill(); maskCtx.roundRect(227, 570, 61, 36, 5); maskCtx.fill(); maskCtx.roundRect(229, 615, 58, 29, 4); maskCtx.fill();
      [[331,599,10],[350,635,7],[332,669,10],[260,35,7],[257,51,7],[254,67,7],[250,83,7],[247,99,7],[243,115,7]].forEach(([x,y,r]) => { maskCtx.beginPath(); maskCtx.arc(x,y,r,0,Math.PI*2); maskCtx.fill(); });
    }
    // Keep the actual strings visible over the finish, not color-tinted.
    maskCtx.lineWidth = 1.4; maskCtx.strokeStyle = '#fff';
    for (let i = 0; i < 6; i++) {
      maskCtx.beginPath(); maskCtx.moveTo(244 + i * 5.6, 137);
      maskCtx.lineTo(240 + i * 7.2, profile === 'acoustic' ? 603 : 632); maskCtx.stroke();
    }
    maskCtx.globalCompositeOperation = 'source-over';
    applyMeshBlueprint(profile === 'acoustic' ? 'steel-acoustic' : 'shortscale-electric');
    meshProfile = profile === 'acoustic' ? 'acoustic-cutaway' : 'electric-singlecut'; el('mesh-profile').value = meshProfile;
    undoStack = []; updateUndo(); render(); return true;
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
      // Fine machining grain, not widely spaced white stripes.
      target.lineWidth = .35;
      for (let y = 0; y < HEIGHT; y += .7) {
        target.strokeStyle = random() > .5 ? '#fff' : '#000';
        target.globalAlpha = opacity * (.025 + random() * .10);
        target.beginPath(); target.moveTo(0, y); target.lineTo(WIDTH, y); target.stroke();
      }
    } else if (finish === 'Carbon Weave') {
      // Alternating over/under fibre bundles instead of a diagonal wire grid.
      target.globalAlpha = opacity * .55;
      for (let y = 0; y < HEIGHT; y += 6) for (let x = 0; x < WIDTH; x += 6) {
        const horizontal = ((x / 6 + y / 6) % 4) < 2;
        const shine = horizontal ? target.createLinearGradient(x, y, x, y + 6) : target.createLinearGradient(x, y, x + 6, y);
        shine.addColorStop(0, '#17191e'); shine.addColorStop(.45, '#88919c'); shine.addColorStop(1, '#23262d');
        target.fillStyle = shine; target.fillRect(x, y, 6, 6);
      }
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
      // Preserve source shading without washing every chosen color into gray.
      const shade = .3 + light / 255 * .95;
      const highlight = Math.max(0, light - 195) * .55;
      output.data[i] = Math.min(255, red * shade + highlight);
      output.data[i + 1] = Math.min(255, green * shade + highlight);
      output.data[i + 2] = Math.min(255, blue * shade + highlight);
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
    clearTimeout(meshUpdateTimer); meshUpdateTimer = setTimeout(updateMeshPreview, 120);
    review?.refresh();
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
    const request = ++sourceRequest;
    try {
      const next = document.createElement('canvas'); next.width = WIDTH; next.height = HEIGHT;
      await loadBitmap(file, next);
      if (request !== sourceRequest) return;
      sourceCtx.clearRect(0, 0, WIDTH, HEIGHT); sourceCtx.drawImage(next, 0, 0); sourceKind = 'import';
      const recognized = applyKnownPhotoMask(file.name);
      if (!recognized) autoMask();
      el('source-name').textContent = file.name;
      el('dimensions').textContent = `${WIDTH} × ${HEIGHT} working canvas`;
      setStatus(recognized ? `Photoreal ${meshProfile.startsWith('acoustic') ? 'acoustic' : 'electric'} profile recognized; its fitted hardware mask is active.` : 'Imported. Use Protect mode to brush over hardware before exporting.');
    } catch { setStatus('That image could not be opened. Try another PNG or WebP.', true); }
  }

  async function loadSample(kind) {
    if (!kind.startsWith('photo-')) { drawSample(kind); return; }
    const request = ++sourceRequest;
    const filename = kind === 'photo-acoustic' ? 'acoustic-cutaway-wood.png' : 'electric-singlecut-wood.png';
    try {
      const response = await fetch(window.GUITAR_STUDIO_SAMPLES?.[filename] || `sources/${filename}`);
      if (!response.ok) throw new Error('Image unavailable');
      const blob = await response.blob();
      if (request !== sourceRequest) return;
      await importSource(new File([blob], filename, { type: 'image/png' }));
    } catch { if (request === sourceRequest) setStatus('Could not load the photoreal source. Try again or import a PNG.', true); }
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
    return { format: 'guitar-finish-studio', version: 1, ...(el('collection-style').value !== '' ? {collectionStyle:Number(el('collection-style').value)} : {}), primary: controls.primary.value, accent: controls.accent.value, primaryFinish: controls.primaryFinish.value, accentFinish: controls.accentFinish.value, pattern: controls.pattern.value, textureStrength: Number(controls.strength.value), patternScale: Number(controls.scale.value), seed: Number(controls.seed.value) };
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
      varyConstruction: el('review-3d').checked && el('vary-construction').checked,
      collectionStyle: recipe().collectionStyle,
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
      if(rules.varyConstruction) {
        result.collectionStyle=index%6;
        result.textureStrength=Math.round(Math.max(0,Math.min(100,rules.textureStrength+(random()-.5)*40)));
        result.patternScale=Math.round(50+random()*130);
      } else if(rules.collectionStyle!==undefined) result.collectionStyle=rules.collectionStyle;
      const key = [primary, accent, ...finishPair, pattern].join('|');
      if (!seen.has(key)) { seen.add(key); results.push(result); }
    }
    return results;
  }

  async function generateBatch() {
    const button = el('generate-batch'); button.disabled = true; el('export-batch').disabled = true;
    try {
      const rules = batchRules(); el('batch-count').value = String(rules.count); el('batch-seed').value = String(rules.seed);
      const construction = el('review-3d').checked ? meshConfiguration() : null;
      el('batch-status').textContent = 'Building rule-based collection…';
      await new Promise((resolve) => requestAnimationFrame(resolve));
      batchResults = buildBatch(rules); generatedRules = rules; generatedConstruction = construction;
      const gallery = el('batch-gallery'); gallery.replaceChildren();
      for (const [index, design] of batchResults.entries()) {
        const item = document.createElement('div'); item.className = 'batch-item';
        const preview = document.createElement('canvas'); preview.width = WIDTH; preview.height = HEIGHT;
        if (construction) { const root = gameMesh(design, construction); try { Guitar3D.snapshot(preview, root); } finally { Guitar3D.dispose(root); } }
        else renderDesign(preview, design);
        const label = document.createElement('span'); label.textContent = `${String(index + 1).padStart(2, '0')} · ${design.pattern}`; label.title = `${design.primary} + ${design.accent}, ${design.primaryFinish} / ${design.accentFinish}`;
        if(construction && design.collectionStyle!==undefined) label.textContent += ` · ${Guitar3D.collectionStyles[design.collectionStyle]}`;
        item.append(preview, label); gallery.append(item);
        if (index % 3 === 2) await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      el('batch-status').textContent = `${batchResults.length} unique ${construction ? '3D assets' : 'image designs'} ready. Seed ${rules.seed}.`;
      el('export-batch').disabled = batchResults.length === 0;
      review.add(batchResults);
    } catch (error) { el('batch-status').textContent = `Collection failed: ${error.message}`; }
    finally { button.disabled = false; }
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

  function applyMeshBlueprint(name) {
    const blueprint = meshBlueprints[name];
    if (!blueprint) return;
    el('mesh-blueprint').value = name; el('mesh-profile').value = blueprint.profile; el('mesh-strings').value = String(blueprint.strings);
    el('mesh-scale').value = blueprint.scale; el('mesh-frets').value = blueprint.frets; el('mesh-nut-width').value = blueprint.nutWidth;
    el('mesh-bridge-spacing').value = blueprint.bridgeSpacing; el('mesh-depth').value = blueprint.depth; el('mesh-pickups').value = blueprint.pickups;
    el('mesh-depth-value').textContent = `${blueprint.depth.toFixed(1)} cm`; el('mesh-spec-note').textContent = blueprint.note; meshProfile = blueprint.profile;
  }

  function meshConfiguration() {
    const preset = meshBlueprints[el('mesh-blueprint').value];
    const config = {
      blueprint: el('mesh-blueprint').value, profile: el('mesh-profile').value, strings: Number(el('mesh-strings').value),
      scaleLengthMm: Number(el('mesh-scale').value), frets: Number(el('mesh-frets').value), nutWidthMm: Number(el('mesh-nut-width').value),
      bridgeSpacingMm: Number(el('mesh-bridge-spacing').value), bodyDepthMeters: Number(el('mesh-depth').value) / 100,
      pickups: el('mesh-pickups').value, handedness: el('mesh-handedness').value, joinFret: preset?.joinFret || Math.min(16, Number(el('mesh-frets').value)),
    };
    const valid = Number.isInteger(config.frets) && config.frets >= 12 && config.frets <= 24 && [4,6,7,8,12].includes(config.strings)
      && config.scaleLengthMm >= 300 && config.scaleLengthMm <= 900 && config.nutWidthMm >= 32 && config.nutWidthMm <= 55
      && config.bridgeSpacingMm >= 30 && config.bridgeSpacingMm <= 65 && config.bodyDepthMeters >= .035 && config.bodyDepthMeters <= .12;
    if (!valid) throw new Error('Check the construction dimensions and try again.');
    return config;
  }

  function buildStaticMesh(config) {
    const vertices = []; const textureCoordinates = []; const sections = [];
    const isBass = config.profile === 'bass-doublecut'; const isAcoustic = config.profile.startsWith('acoustic'); const mirror = config.handedness === 'left' ? -1 : 1;
    const scale = isBass ? .0015 : isAcoustic ? .00136 : .00132;
    const mapPoint = ([x, y]) => [(x - 256) * scale * mirror, (740 - y) * scale];
    const outlines = {
      'acoustic-dreadnought': [[184,379],[157,397],[151,441],[164,485],[142,530],[116,605],[116,657],[143,704],[194,730],[256,739],[318,730],[369,704],[396,657],[396,605],[370,530],[348,485],[361,441],[355,397],[328,379]],
      'acoustic-cutaway': [[184,379],[158,394],[153,438],[164,485],[142,530],[116,605],[116,657],[143,704],[194,730],[256,739],[319,727],[370,700],[394,654],[390,607],[367,548],[348,498],[354,452],[344,418],[316,408],[290,405],[276,379]],
      'electric-singlecut': [[187,418],[158,425],[150,470],[153,520],[140,570],[132,635],[140,690],[179,727],[259,742],[337,728],[378,694],[385,642],[376,585],[365,536],[367,493],[356,453],[335,449],[310,463],[290,482],[270,490],[253,490],[231,460],[210,428]],
      'electric-doublecut': [[223,414],[187,398],[158,421],[154,463],[183,488],[151,532],[137,604],[145,682],[187,724],[256,741],[325,724],[367,682],[375,604],[361,532],[329,488],[358,463],[354,421],[325,398],[289,414],[278,470],[234,470]],
      'bass-doublecut': [[225,406],[187,388],[154,414],[151,463],[184,492],[151,538],[136,616],[147,690],[193,728],[256,741],[319,728],[365,690],[376,616],[361,538],[328,492],[361,463],[358,414],[325,388],[287,406],[277,468],[235,468]],
    };
    const bodyOutline = outlines[config.profile] || outlines['electric-doublecut'];

    function triangulate(points) {
      const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const area = points.reduce((sum, point, index) => { const next = points[(index + 1) % points.length]; return sum + point[0] * next[1] - next[0] * point[1]; }, 0);
      const orientation = area >= 0 ? 1 : -1; const remaining = points.map((_, index) => index); const triangles = [];
      const inside = (point, a, b, c) => {
        const first = cross(a, b, point) * orientation; const second = cross(b, c, point) * orientation; const third = cross(c, a, point) * orientation;
        return first >= -1e-7 && second >= -1e-7 && third >= -1e-7;
      };
      let guard = points.length * points.length;
      while (remaining.length > 3 && guard-- > 0) {
        let clipped = false;
        for (let index = 0; index < remaining.length; index += 1) {
          const previous = remaining[(index - 1 + remaining.length) % remaining.length]; const current = remaining[index]; const next = remaining[(index + 1) % remaining.length];
          if (cross(points[previous], points[current], points[next]) * orientation <= 1e-7) continue;
          if (remaining.some((candidate) => candidate !== previous && candidate !== current && candidate !== next && inside(points[candidate], points[previous], points[current], points[next]))) continue;
          triangles.push([previous, current, next]); remaining.splice(index, 1); clipped = true; break;
        }
        if (!clipped) throw new Error('The selected body outline could not be triangulated.');
      }
      if (remaining.length === 3) triangles.push(remaining);
      return triangles;
    }

    function addMeterExtruded(name, points, depth, material, texturePoints = null, centerY = 0) {
      const start = vertices.length + 1; const frontY = centerY + depth / 2; const backY = centerY - depth / 2;
      points.forEach(([x,z], index) => { vertices.push([x,frontY,z]); textureCoordinates.push(texturePoints ? [texturePoints[index][0] / WIDTH, 1 - texturePoints[index][1] / HEIGHT] : [.5 + x, Math.max(0, Math.min(1, z))]); });
      points.forEach(([x,z], index) => { vertices.push([x,backY,z]); textureCoordinates.push(texturePoints ? [texturePoints[index][0] / WIDTH, 1 - texturePoints[index][1] / HEIGHT] : [.5 + x, Math.max(0, Math.min(1, z))]); });
      const front = points.map((_, index) => start + index); const back = points.map((_, index) => start + points.length + index);
      const triangles = triangulate(points);
      const faces = triangles.flatMap((triangle) => [
        `f ${triangle.map((index) => `${front[index]}/${front[index]}`).join(' ')}`,
        `f ${triangle.slice().reverse().map((index) => `${back[index]}/${back[index]}`).join(' ')}`,
      ]);
      for (let index = 0; index < points.length; index += 1) { const next = (index + 1) % points.length; faces.push(`f ${front[index]}/${front[index]} ${front[next]}/${front[next]} ${back[next]}/${back[next]} ${back[index]}/${back[index]}`); }
      sections.push(`g ${name}\nusemtl ${material}\ns 1\n${faces.join('\n')}`);
    }

    function addExtruded(name, points2d, depth, material) { addMeterExtruded(name, points2d.map(mapPoint), depth, material, points2d); }

    function addBox(name, minX, maxX, minY, maxY, minZ, maxZ, material) {
      const start = vertices.length + 1;
      [[minX,minY,minZ],[maxX,minY,minZ],[maxX,maxY,minZ],[minX,maxY,minZ],[minX,minY,maxZ],[maxX,minY,maxZ],[maxX,maxY,maxZ],[minX,maxY,maxZ]].forEach(([x,y,z]) => { vertices.push([x,y,z]); textureCoordinates.push([.5 + x, Math.max(0, Math.min(1, z))]); });
      const face = (...indices) => `f ${indices.map((index) => `${start+index}/${start+index}`).join(' ')}`;
      sections.push(`g ${name}\nusemtl ${material}\ns off\n${[face(0,1,2,3),face(4,7,6,5),face(0,4,5,1),face(1,5,6,2),face(2,6,7,3),face(4,0,3,7)].join('\n')}`);
    }

    function addSlopedRibbon(name, startPoint, endPoint, width, thickness, material) {
      const [startX,startY,startZ] = startPoint; const [endX,endY,endZ] = endPoint; const dx = endX - startX; const dz = endZ - startZ; const length = Math.hypot(dx,dz);
      const px = -dz / length * width; const pz = dx / length * width; const start = vertices.length + 1;
      [[startX+px,startY,startZ+pz],[endX+px,endY,endZ+pz],[endX-px,endY,endZ-pz],[startX-px,startY,startZ-pz],[startX+px,startY+thickness,startZ+pz],[endX+px,endY+thickness,endZ+pz],[endX-px,endY+thickness,endZ-pz],[startX-px,startY+thickness,startZ-pz]].forEach(([x,y,z]) => { vertices.push([x,y,z]); textureCoordinates.push([.5 + x, Math.max(0, Math.min(1,z))]); });
      const face = (...indices) => `f ${indices.map((index) => `${start+index}/${start+index}`).join(' ')}`;
      sections.push(`g ${name}\nusemtl ${material}\ns off\n${[face(0,1,2,3),face(4,7,6,5),face(0,4,5,1),face(1,5,6,2),face(2,6,7,3),face(4,0,3,7)].join('\n')}`);
    }

    function addCylinderY(name, centerX, centerZ, minY, maxY, radius, material, sides = 20) {
      const start = vertices.length + 1;
      for (const y of [minY, maxY]) for (let index = 0; index < sides; index += 1) { const angle = index / sides * Math.PI * 2; vertices.push([centerX + Math.cos(angle) * radius, y, centerZ + Math.sin(angle) * radius]); textureCoordinates.push([.5 + Math.cos(angle) * .5, .5 + Math.sin(angle) * .5]); }
      const faces = []; const front = Array.from({length: sides}, (_, index) => start + index); const back = Array.from({length: sides}, (_, index) => start + sides + index);
      faces.push(`f ${front.map((value) => `${value}/${value}`).join(' ')}`, `f ${back.slice().reverse().map((value) => `${value}/${value}`).join(' ')}`);
      for (let index = 0; index < sides; index += 1) { const next = (index + 1) % sides; faces.push(`f ${front[index]}/${front[index]} ${front[next]}/${front[next]} ${back[next]}/${back[next]} ${back[index]}/${back[index]}`); }
      sections.push(`g ${name}\nusemtl ${material}\ns 1\n${faces.join('\n')}`);
    }

    const bodyDepth = config.bodyDepthMeters; const scaleLength = config.scaleLengthMm / 1000; const nutWidth = config.nutWidthMm / 1000; const bridgeSpacing = config.bridgeSpacingMm / 1000;
    const bridgeZ = .19; const nutZ = bridgeZ + scaleLength; const joinDistance = scaleLength * (1 - 2 ** (-config.joinFret / 12)); const jointZ = nutZ - joinDistance;
    const heelWidth = Math.max(nutWidth + .012, bridgeSpacing * .92); const front = bodyDepth / 2 + .002;
    addExtruded('Body', bodyOutline, bodyDepth, 'Finish');
    const neckDepth = bodyDepth * .30; const neckCenterY = bodyDepth / 2 - neckDepth / 2;
    addMeterExtruded('Neck', [[-nutWidth/2,nutZ],[nutWidth/2,nutZ],[heelWidth/2,jointZ],[-heelWidth/2,jointZ]].map(([x,z]) => [x * mirror,z]), neckDepth, 'NeckWood', null, neckCenterY);
    const headWidth = Math.max(nutWidth * 1.35, .058); const headLength = isBass ? .205 : .175;
    const headDepth = bodyDepth * .34; const headCenterY = bodyDepth / 2 - headDepth / 2;
    addMeterExtruded('Headstock', [[-nutWidth/2,nutZ],[nutWidth/2,nutZ],[headWidth*.58,nutZ+headLength],[-headWidth*.42,nutZ+headLength]].map(([x,z]) => [x * mirror,z]), headDepth, 'Finish', null, headCenterY);
    addBox('Nut', -nutWidth/2, nutWidth/2, front, front + .005, nutZ - .002, nutZ + .002, 'Nut');
    const bridgeHalfWidth = isAcoustic ? .075 : isBass ? .05 : .045;
    addBox('Bridge', -bridgeHalfWidth, bridgeHalfWidth, front, front + .012, bridgeZ - (isAcoustic ? .014 : .010), bridgeZ + (isAcoustic ? .014 : .010), 'Hardware');

    const fretPositions = [];
    for (let fret = 1; fret <= config.frets; fret += 1) {
      const fromNut = scaleLength * (1 - 2 ** (-fret / 12)); const z = nutZ - fromNut; const neckRatio = Math.min(1, fromNut / Math.max(.001, joinDistance));
      const halfWidth = (nutWidth / 2 + (heelWidth - nutWidth) / 2 * neckRatio) * .98;
      addBox(`Fret_${String(fret).padStart(2,'0')}`, -halfWidth, halfWidth, front + .005, front + .007, z - .0007, z + .0007, 'Frets'); fretPositions.push({ fret, fromNutMm: Number((fromNut * 1000).toFixed(2)) });
    }

    for (let index = 0; index < config.strings; index += 1) {
      const ratio = config.strings === 1 ? .5 : index / (config.strings - 1); const bridgeX = (-bridgeSpacing / 2 + ratio * bridgeSpacing) * mirror; const nutX = (-nutWidth * .42 + ratio * nutWidth * .84) * mirror;
      const width = (isBass ? .00045 : .00022) + ratio * (isBass ? .00065 : .00032);
      addSlopedRibbon(`String_${index + 1}`, [nutX,front+.008,nutZ], [bridgeX,front+.013,bridgeZ], width, .0008, 'Strings');
      const tunerSide = isAcoustic ? (index % 2 ? 1 : -1) : (mirror > 0 ? 1 : -1); const tunerZ = nutZ + .035 + Math.floor(isAcoustic ? index / 2 : index) * (headLength - .06) / Math.max(1, isAcoustic ? Math.ceil(config.strings/2)-1 : config.strings-1);
      addBox(`Tuner_${index + 1}`, tunerSide * headWidth*.42 - .006, tunerSide * headWidth*.42 + .006, front - .002, front + .009, tunerZ - .006, tunerZ + .006, 'Hardware');
    }

    if (isAcoustic) addCylinderY('Soundhole', 0, .345, front, front + .002, .047, 'Dark');
    if (config.pickups === 'sss') [.27,.34,.41].forEach((z, index) => addBox(`Pickup_${index + 1}`, -.038, .038, front, front + .012, z - .009, z + .009, 'Pickup'));
    if (config.pickups === 'hh') [.285,.405].forEach((z, index) => addBox(`Pickup_${index + 1}`, -.046, .046, front, front + .014, z - .019, z + .019, 'Pickup'));
    if (config.pickups === 'p' || config.pickups === 'pj') {
      addBox('Pickup_P_Bass', -.052, .004, front, front + .014, .325, .343, 'Pickup'); addBox('Pickup_P_Treble', -.004, .052, front, front + .014, .341, .359, 'Pickup');
      if (config.pickups === 'pj') addBox('Pickup_J', -.052, .052, front, front + .012, .275, .293, 'Pickup');
    }
    if (!isAcoustic) {
      const side = config.handedness === 'left' ? -1 : 1;
      const controlsLayout = config.pickups === 'hh' ? [[.09,.26],[.125,.29],[.09,.34],[.125,.37]] : config.pickups === 'p' || config.pickups === 'pj' ? [[.108,.27],[.118,.33]] : [[.102,.25],[.118,.31],[.108,.37]];
      controlsLayout.forEach(([x,z], index) => addCylinderY(`Control_${index + 1}`, x * side, z, front, front + .014, .009, 'Control', 16));
    }
    const vertexLines = vertices.map((value) => `v ${value.map((part) => part.toFixed(6)).join(' ')}`);
    const uvLines = textureCoordinates.map((value) => `vt ${value.map((part) => part.toFixed(6)).join(' ')}`);
    const objectName = config.profile.replaceAll('-', '_'); const object = [`# Guitar Finish Studio static mesh`, `# Dimensions are stored in meters`, `mtllib guitar.mtl`, `o ${objectName}`, ...vertexLines, ...uvLines, ...sections, ''].join('\n');
    const material = `newmtl Finish\nKa 0.100 0.100 0.100\nKd 1.000 1.000 1.000\nKs 0.350 0.350 0.350\nNs 220\nillum 2\nmap_Kd guitar-finish.png\n\nnewmtl NeckWood\nKa 0.080 0.050 0.030\nKd 0.260 0.140 0.080\nKs 0.120 0.120 0.120\nNs 40\nillum 2\n\nnewmtl Hardware\nKa 0.120 0.120 0.120\nKd 0.520 0.500 0.450\nKs 0.800 0.800 0.800\nNs 500\nillum 2\n\nnewmtl Strings\nKa 0.200 0.200 0.200\nKd 0.720 0.700 0.640\nKs 0.900 0.900 0.900\nNs 700\nillum 2\n\nnewmtl Frets\nKd 0.720 0.720 0.700\nKs 0.900 0.900 0.900\nNs 600\nillum 2\n\nnewmtl Nut\nKd 0.900 0.870 0.760\nKs 0.200 0.200 0.200\nNs 100\nillum 2\n\nnewmtl Dark\nKd 0.025 0.020 0.018\nKs 0.050 0.050 0.050\nNs 20\nillum 2\n\nnewmtl Pickup\nKd 0.780 0.750 0.680\nKs 0.850 0.850 0.850\nNs 500\nillum 2\n\nnewmtl Control\nKd 0.720 0.570 0.220\nKs 0.900 0.800 0.500\nNs 500\nillum 2\n`;
    return { object, material, vertexCount: vertices.length, groupCount: sections.length, fretPositions, bodyOutline };
  }

  let meshViewer;
  function gameMesh(design = recipe(), config = meshConfiguration(), lod = 0) {
    return Guitar3D.build(config, design, buildStaticMesh(config).bodyOutline, lod);
  }
  function updateMeshPreview() {
    try {
      meshViewer ||= Guitar3D.viewer(el('mesh-preview'));
      const stats = meshViewer.set(gameMesh());
      el('mesh-status').textContent = `Actual LOD0: ${stats.triangles.toLocaleString()} triangles · ${stats.meshes} parts · ${stats.sizeMeters[1].toFixed(2)} m tall. No animations.`;
    } catch (error) { el('mesh-status').textContent = `3D preview unavailable: ${error.message}`; }
  }
  async function exportGameAsset() {
    const button = el('export-game-asset'); button.disabled = true;
    const entries = [], levels = [];
    try {
      const config = meshConfiguration(), design = recipe();
      for (let lod = 0; lod < 3; lod++) {
        el('mesh-status').textContent = `Building static LOD${lod}…`;
        const root = gameMesh(design, config, lod);
        try {
          levels.push({ file: `guitar_LOD${lod}.glb`, ...Guitar3D.statistics(root) });
          entries.push({ name: `guitar_LOD${lod}.glb`, data: new Uint8Array(await (await Guitar3D.glb(root)).arrayBuffer()) });
          if (lod === 0) {
            const proxy = Guitar3D.collision(root);
            try { entries.push({ name: 'collision.glb', data: new Uint8Array(await (await Guitar3D.glb(proxy)).arrayBuffer()) }); }
            finally { Guitar3D.dispose(proxy); }
          }
        } finally { Guitar3D.dispose(root); }
      }
      entries.push({ name: 'asset.json', data: new TextEncoder().encode(JSON.stringify({ format: 'guitar-game-asset', version: 1, units: 'meters', upAxis: 'Y', frontAxis: '+Z', animations: false, config, design, levels }, null, 2)) });
      entries.push({ name: 'IMPORT.txt', data: new TextEncoder().encode('Import guitar_LOD0.glb as the main static mesh. Materials and textures are embedded. LOD1 and LOD2 are separate alternatives: assign them in your engine, not as overlapping visible meshes. collision.glb contains coarse BOX proxies; configure them as collision-only in your engine. glTF does not standardize collision or automatic LOD selection. No rig or animation is included. The procedural mesh does not reconstruct a photograph. Verify your target engine, scale, lighting and performance before shipping.\n') });
      const url = URL.createObjectURL(storeZip(entries)), link = document.createElement('a'); link.href = url; link.download = `guitar-game-asset-${config.profile}.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      el('mesh-status').textContent = `Exported static GLBs: ${levels.map(item => item.triangles + ' tris').join(' / ')}; PBR materials, collision proxies and import notes included.`;
    } catch (error) { el('mesh-status').textContent = `Game export failed: ${error.message}`; }
    finally { button.disabled = false; }
  }

  async function exportStaticMesh() {
    const button = el('export-mesh'); button.disabled = true; el('mesh-status').textContent = 'Building mesh and texture…';
    try {
      const config = meshConfiguration(); const mesh = buildStaticMesh(config); const textureCanvas = document.createElement('canvas'); textureCanvas.width = WIDTH; textureCanvas.height = HEIGHT; renderDesign(textureCanvas, recipe());
      if (config.handedness === 'left') { const copy = document.createElement('canvas'); copy.width = WIDTH; copy.height = HEIGHT; copy.getContext('2d').drawImage(textureCanvas, 0, 0); const output = textureCanvas.getContext('2d'); output.clearRect(0,0,WIDTH,HEIGHT); output.save(); output.translate(WIDTH,0); output.scale(-1,1); output.drawImage(copy,0,0); output.restore(); }
      const entries = [
        { name: 'guitar.obj', data: new TextEncoder().encode(mesh.object) },
        { name: 'guitar.mtl', data: new TextEncoder().encode(mesh.material) },
        { name: 'guitar-finish.png', data: new Uint8Array(await (await canvasBlob(textureCanvas)).arrayBuffer()) },
        { name: 'mesh-info.json', data: new TextEncoder().encode(`${JSON.stringify({ format: 'guitar-finish-studio-static-mesh', version: 2, ...config, units: 'meters', vertices: mesh.vertexCount, groups: mesh.groupCount, fretPositions: mesh.fretPositions, static: true, rigged: false, recipe: recipe(), references: ['https://www.stewmac.com/fret-calculator/', 'https://www.martinguitar.com/10Y25D28.html', 'https://www.fender.com/products/american-professional-ii-stratocaster', 'https://www.fender.com/products/american-professional-classic-precision-bass', 'https://images.gibson.com/Products/Electric-Guitars/2018/Custom/59-LP-Standard/Documents/59-LP-Standard-One-Sheet.pdf'] }, null, 2)}\n`) },
      ];
      const blob = storeZip(entries); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `guitar-static-mesh-${config.profile}.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      el('mesh-status').textContent = `${mesh.vertexCount} vertices across ${mesh.groupCount} named objects downloaded.`;
    } catch (error) { el('mesh-status').textContent = error instanceof Error ? error.message : 'The mesh could not be exported. Try again with a built-in blueprint.'; }
    button.disabled = false;
  }

  async function exportBatch(designs = batchResults, rules = generatedRules, images = [], models = []) {
    if (!designs.length) return;
    const snapshot = designs.map((design) => ({ ...design }));
    const button = el('export-batch'); button.disabled = true; const entries = [];
    try {
      // Freeze geometry with the batch so later construction edits cannot change its export.
      const construction = rules ? generatedConstruction : null;
      for (let index = 0; index < snapshot.length; index += 1) {
        el('batch-status').textContent = `Rendering ${index + 1} of ${snapshot.length}…`;
        const output = document.createElement('canvas'); output.width = WIDTH; output.height = HEIGHT;
        if (construction) {
          const root = gameMesh(snapshot[index], construction);
          try { Guitar3D.snapshot(output, root); models[index] = await Guitar3D.glb(root); }
          finally { Guitar3D.dispose(root); }
        } else if (!images[index]) renderDesign(output, snapshot[index]);
        entries.push({ name: `designs/guitar-finish-${String(index + 1).padStart(2, '0')}.png`, data: new Uint8Array(await (images[index] || await canvasBlob(output)).arrayBuffer()) });
        if (models[index]) entries.push({ name: `models/guitar-${String(index + 1).padStart(2, '0')}.glb`, data: new Uint8Array(await models[index].arrayBuffer()) });
        if (index % 4 === 3) await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      const manifest = { format: 'guitar-finish-studio-collection', version: 1, createdBy: 'Guitar Finish Studio', rules, construction, designs: snapshot,
        models: models.map((model, index) => model ? `models/guitar-${String(index + 1).padStart(2, '0')}.glb` : null) };
      entries.push({ name: 'manifest.json', data: new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`) });
      const blob = storeZip(entries); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = rules ? `guitar-finish-batch-${rules.seed}.zip` : 'guitar-kept-finishes.zip'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      el('batch-status').textContent = `${snapshot.length} thumbnails, ${models.filter(Boolean).length} static GLBs and manifest downloaded as one ZIP.`;
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
      if(value.collectionStyle!==undefined && (!Number.isInteger(value.collectionStyle)||value.collectionStyle<0||value.collectionStyle>5)) throw new Error('style');
      el('collection-style').value=value.collectionStyle===undefined?'':String(value.collectionStyle);
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
  el('sample-model').addEventListener('change', (event) => { void loadSample(event.target.value); });
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
  el('reset-all').addEventListener('click', () => { el('collection-style').value=''; controls.preset.value = '0'; applyPreset(0); void loadSample(el('sample-model').value); setStatus('Design reset.'); });
  el('brush-size').addEventListener('input', () => { el('brush-value').textContent = `${el('brush-size').value} px`; });
  el('generate-batch').addEventListener('click', generateBatch);
  el('export-batch').addEventListener('click', () => exportBatch());
  el('mesh-blueprint').addEventListener('change', (event) => { if (event.target.value !== 'custom') applyMeshBlueprint(event.target.value); });
  ['mesh-profile','mesh-strings','mesh-scale','mesh-frets','mesh-nut-width','mesh-bridge-spacing','mesh-pickups'].forEach((id) => el(id).addEventListener('input', () => {
    el('mesh-blueprint').value = 'custom'; meshProfile = el('mesh-profile').value; el('mesh-spec-note').textContent = 'Custom dimensions · verify against your intended instrument before manufacturing.';
  }));
  el('mesh-depth').addEventListener('input', () => { el('mesh-blueprint').value = 'custom'; el('mesh-depth-value').textContent = `${Number(el('mesh-depth').value).toFixed(1)} cm`; el('mesh-spec-note').textContent = 'Custom dimensions · verify against your intended instrument before manufacturing.'; });
  el('export-mesh').addEventListener('click', exportStaticMesh);
  el('preview-mesh').addEventListener('click', updateMeshPreview);
  document.querySelector('.mesh-card').addEventListener('input', () => { review?.refresh(); clearTimeout(meshUpdateTimer); meshUpdateTimer = setTimeout(updateMeshPreview, 120); });
  el('export-game-asset').addEventListener('click', exportGameAsset);
  el('review-3d').addEventListener('change', () => review?.refresh());
  document.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); } });
  ['dragenter','dragover'].forEach((name) => canvas.parentElement.addEventListener(name, (event) => { event.preventDefault(); el('drop-hint').hidden = false; }));
  ['dragleave','drop'].forEach((name) => canvas.parentElement.addEventListener(name, (event) => { event.preventDefault(); el('drop-hint').hidden = true; }));
  canvas.parentElement.addEventListener('drop', (event) => importSource(event.dataTransfer.files[0]));

  applyPreset(0); void loadSample('photo-acoustic');
  review = GuitarReview.mount({
    host: el('batch-gallery').parentElement,
    render: (target, design) => {
      if (!el('review-3d').checked) return renderDesign(target, design);
      const root = gameMesh(design);
      try { Guitar3D.snapshot(target, root); } finally { Guitar3D.dispose(root); }
    },
    captureModel: async (design) => {
      if (!el('review-3d').checked) return null;
      const root = gameMesh(design);
      try { return await Guitar3D.glb(root); } finally { Guitar3D.dispose(root); }
    },
    exportDesigns: (designs, images, models) => exportBatch(designs, null, images, models),
    validate: (design) => design && design.format === 'guitar-finish-studio' && design.version === 1
      && (design.collectionStyle===undefined || (Number.isInteger(design.collectionStyle) && design.collectionStyle>=0 && design.collectionStyle<=5))
      && /^#[0-9a-f]{6}$/i.test(design.primary) && /^#[0-9a-f]{6}$/i.test(design.accent)
      && finishes.includes(design.primaryFinish) && finishes.includes(design.accentFinish) && patterns.includes(design.pattern)
      && Number.isFinite(design.textureStrength) && design.textureStrength >= 0 && design.textureStrength <= 100
      && Number.isFinite(design.patternScale) && design.patternScale >= 50 && design.patternScale <= 180
      && Number.isInteger(design.seed) && design.seed >= 1 && design.seed <= 999999,
    generate: (approved, generation = 0) => {
      const rules = batchRules();
      return (approved.length ? approved.slice(-4) : [recipe()]).flatMap((design, index) => buildBatch({ ...rules,
        basePrimary: design.primary, baseAccent: design.accent, count: 12,
        seed: (rules.seed + design.seed + index * 7919 + generation * 104729) % 999999 + 1,
      }));
    },
  });
  updateMeshPreview();
})();
