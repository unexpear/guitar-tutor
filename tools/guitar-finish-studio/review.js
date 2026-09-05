/* Local recipe review and an example-based preference ranker. No image model or network. */
(() => {
  'use strict';
  const fields = ['primary', 'accent', 'primaryFinish', 'accentFinish', 'pattern', 'textureStrength', 'patternScale', 'seed', 'collectionStyle'];
  const key = (design) => fields.map((field) => design[field]).join('|');
  const familyLabel = design => design.collectionStyle===undefined?'':` · ${window.Guitar3D.collectionStyles[design.collectionStyle]}`;
  const colorDistance = (a, b) => {
    const channels = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
    const x = channels(a); const y = channels(b);
    return x.reduce((sum, value, i) => sum + (value - y[i]) ** 2, 0) / 3;
  };
  function distance(a, b) {
    return colorDistance(a.primary, b.primary) + colorDistance(a.accent, b.accent)
      + ['primaryFinish', 'accentFinish', 'pattern', 'collectionStyle'].reduce((sum, field) => sum + (a[field] === b[field] ? 0 : .4), 0)
      + Math.abs(a.textureStrength - b.textureStrength) / 500
      + Math.abs(a.patternScale - b.patternScale) / 650;
  }
  function score(design, history) {
    const nearest = history.map((entry) => ({ ...entry, distance: distance(design, entry.design) }))
      .sort((a, b) => a.distance - b.distance).slice(0, 5);
    let weight = 0; let votes = 0;
    for (const entry of nearest) {
      const w = 1 / (.05 + entry.distance); weight += w;
      votes += (entry.keep ? 1 : -1) * w;
    }
    return weight ? votes / weight : 0;
  }

  function mount({ host, render, generate, exportDesigns, validate, captureModel }) {
    const storageKey = 'guitar-finish-review-v1';
    let history = []; let queue = []; let undo = []; let busy = false; let storageWorks = true;
    let previewReady = false;
    let basketPage = 0; let pageRevision = 0; let generation = Date.now() % 999999;
    const sessionImages = new Map();
    const database = new Promise((resolve) => {
      try {
        const request = indexedDB.open('guitar-review-images', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('images');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
    async function imageStore(operation, id, blob) {
      const db = await database;
      if (!db) throw new Error('Image storage unavailable');
      return new Promise((resolve, reject) => {
        const tx = db.transaction('images', operation === 'get' ? 'readonly' : 'readwrite');
        const store = tx.objectStore('images');
        const request = operation === 'put' ? store.put(blob, id) : store[operation](id);
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = tx.onabort = () => reject(tx.error || new Error('Image storage failed'));
      });
    }
    async function savedImage(entry) {
      if (!entry.imageId) return null;
      return sessionImages.get(entry.imageId) || await imageStore('get', entry.imageId);
    }
    async function savedModel(entry) {
      if (!entry.hasModel || !entry.imageId) return null;
      return sessionImages.get(entry.imageId + '-glb') || await imageStore('get', entry.imageId + '-glb');
    }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(stored)) history = stored.filter((entry) => entry && typeof entry.keep === 'boolean' && validate(entry.design));
    } catch { storageWorks = false; }
    const section = document.createElement('section'); section.className = 'card review-panel';
    section.innerHTML = `
      <div class="section-heading"><h2>Keep or pass</h2><span class="new-badge">REVIEW</span></div>
      <p class="help">Swipe right to keep, left to pass. Buttons and arrow keys work too. Finish recipes follow the current guitar and paint mask.</p>
      <div class="review-card" tabindex="0" role="group" aria-label="Design review. Right arrow keeps, left arrow passes.">
        <canvas width="512" height="768" aria-label="Current finish preview"></canvas>
        <strong class="review-gesture" aria-hidden="true"></strong>
      </div>
      <p class="review-description"></p>
      <p class="review-status help" role="status" aria-live="polite"></p>
      <div class="review-actions">
        <button type="button" class="button button-danger" data-action="pass">← Pass</button>
        <button type="button" class="button button-secondary" data-action="undo">Undo</button>
        <button type="button" class="button button-primary" data-action="keep">Keep →</button>
      </div>
      <button type="button" class="button button-secondary wide-button" data-action="suggest">More designs / similar finishes</button>
      <p class="help review-explanation">Suggestions learn from colors, finishes, patterns and design families in your decisions. They do not judge photo quality or engineering. Batch rules still apply.</p>
      <details class="review-basket"><summary>Basket (<span class="basket-count">0</span>) — browse or remove</summary>
        <p class="help">Kept images stay as approved, even when you change guitars. Older recipe-only keeps use the current guitar. Download a ZIP for a permanent backup; browser storage is not unlimited.</p>
        <div class="basket-items"></div>
        <div class="review-actions"><button type="button" data-action="previous">Previous</button><span class="basket-page"></span><button type="button" data-action="next">Next</button></div>
      </details>
      <button type="button" class="button button-secondary wide-button" data-action="export">Download basket ZIP</button>
      <button type="button" class="text-button" data-action="backup">Back up decisions</button>
      <button type="button" class="text-button" data-action="restore">Restore decisions</button>
      <input type="file" accept="application/json" class="review-restore" hidden />
      <button type="button" class="text-button" data-action="clear">Clear saved decisions…</button>`;
    host.append(section);
    const find = (selector) => section.querySelector(selector);
    const action = (name) => find(`[data-action="${name}"]`);
    const card = find('.review-card'); const preview = find('canvas');
    const kept = () => history.filter((entry) => entry.keep).map((entry) => entry.design);
    function save() {
      // Keep every approved item, but bound the preference learner's rejected history.
      const recentPasses = new Set(history.filter((entry) => !entry.keep).slice(-1000));
      history = history.filter((entry) => entry.keep || recentPasses.has(entry));
      try { localStorage.setItem(storageKey, JSON.stringify(history)); storageWorks = true; }
      catch { storageWorks = false; }
      if (sessionImages.size) storageWorks = false;
    }
    function refresh() {
      const design = queue[0];
      let renderError;
      card.hidden = !design;
      previewReady = false;
      if (design) {
        try { render(preview, design); previewReady = true; }
        catch (error) { renderError = error.message; card.hidden = true; }
      }
      find('.review-description').textContent = design
        ? `${design.primaryFinish} / ${design.accentFinish} · ${design.pattern} · ${design.primary} + ${design.accent}${familyLabel(design)}`
        : 'Request more designs or generate a batch. Stop and download your basket whenever you like.';
      find('.review-status').textContent = `${queue.length} to review · ${kept().length} kept · ${history.filter((entry) => !entry.keep).length} passed. ${storageWorks ? 'Decisions saved in this browser.' : 'Storage unavailable: back up decisions before closing.'}`;
      action('keep').disabled = action('pass').disabled = !design || busy || !previewReady;
      action('undo').disabled = !undo.length || busy;
      action('suggest').disabled = busy;
      action('export').disabled = !kept().length || busy;
      action('clear').disabled = !history.length || busy;
      refreshBasket();
      if (renderError) find('.review-status').textContent = `Preview unavailable: ${renderError}. Check construction values, or turn off 3D review if WebGL is unavailable.`;
    }
    async function refreshBasket() {
      const revision = ++pageRevision;
      const entries = history.filter((entry) => entry.keep);
      basketPage = Math.max(0, Math.min(basketPage, Math.ceil(entries.length / 6) - 1));
      find('.basket-count').textContent = entries.length;
      find('.basket-page').textContent = entries.length ? `${basketPage + 1} / ${Math.ceil(entries.length / 6)}` : 'Empty';
      action('previous').disabled = busy || basketPage === 0;
      action('next').disabled = busy || (basketPage + 1) * 6 >= entries.length;
      const container = find('.basket-items'); container.replaceChildren();
      for (const entry of entries.slice(basketPage * 6, basketPage * 6 + 6)) {
        const item = document.createElement('div'); item.className = 'basket-item';
        const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 768;
        canvas.setAttribute('aria-label', 'Kept guitar'); item.append(canvas);
        const label = document.createElement('p'); label.textContent = `${entry.design.primaryFinish} · ${entry.design.pattern}${familyLabel(entry.design)}${entry.hasModel ? ' · 3D GLB' : entry.imageId ? ' · image only' : ' (recipe only)'}`; item.append(label);
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove from basket'; remove.disabled = busy;
        remove.onclick = () => {
          if (busy) return;
          entry.keep = false; undo = []; save(); refresh();
          if (entry.imageId) { for (const id of [entry.imageId, entry.imageId + '-glb']) { sessionImages.delete(id); void imageStore('delete', id).catch(() => {}); } delete entry.imageId; delete entry.hasModel; save(); }
        };
        item.append(remove); container.append(item);
        try {
          const blob = await savedImage(entry);
          if (revision !== pageRevision) return;
          if (blob) { const bitmap = await createImageBitmap(blob); canvas.getContext('2d').drawImage(bitmap, 0, 0); bitmap.close(); }
          else if (entry.imageId) label.textContent += ' — image missing; restore from your ZIP';
          else render(canvas, entry.design);
        } catch { label.textContent += ' — preview unavailable'; }
      }
    }
    action('previous').onclick = () => { basketPage--; refreshBasket(); };
    action('next').onclick = () => { basketPage++; refreshBasket(); };
    async function decide(keep) {
      if (!queue.length || busy || !previewReady) return;
      busy = true;
      let imageId;
      let hasModel = false;
      if (keep) {
        // Capture synchronously before another source/model can change the preview.
        const captured = document.createElement('canvas'); captured.width = preview.width; captured.height = preview.height;
        captured.getContext('2d').drawImage(preview, 0, 0);
        // Build the model before yielding so it matches the approved construction.
        let model;
        try { model = await captureModel?.(queue[0]); }
        catch (error) { busy = false; refresh(); find('.review-status').textContent = `Could not keep 3D asset: ${error.message}`; return; }
        const blob = await new Promise((resolve) => captured.toBlob(resolve, 'image/png'));
        if (!blob) { busy = false; refresh(); find('.review-status').textContent = 'Could not capture this guitar. Please try again.'; return; }
        imageId = crypto.randomUUID();
        try { await imageStore('put', imageId, blob); }
        catch { sessionImages.set(imageId, blob); storageWorks = false; }
        if (model) {
          hasModel = true;
          try { await imageStore('put', imageId + '-glb', model); }
          catch { sessionImages.set(imageId + '-glb', model); storageWorks = false; }
        }
      }
      const design = queue.shift();
      const previous = history.find((entry) => key(entry.design) === key(design));
      history = history.filter((entry) => key(entry.design) !== key(design));
      history.push({ design, keep, ...(imageId ? { imageId, hasModel } : {}) }); undo.push({ design, previous });
      undo = undo.slice(-100); busy = false; save(); if (sessionImages.size) storageWorks = false; refresh();
    }
    action('keep').onclick = () => decide(true);
    action('pass').onclick = () => decide(false);
    action('undo').onclick = () => {
      if (busy) return;
      const entry = undo.pop(); if (!entry) return;
      const removed = history.find((item) => key(item.design) === key(entry.design));
      if (removed?.imageId) for (const id of [removed.imageId, removed.imageId + '-glb']) { sessionImages.delete(id); void imageStore('delete', id).catch(() => {}); }
      history = history.filter((item) => key(item.design) !== key(entry.design));
      if (entry.previous) history.push(entry.previous);
      queue.unshift(entry.design); save(); refresh();
    };
    action('suggest').onclick = async () => {
      if (busy) return;
      busy = true; refresh();
      try {
        const reviewed = new Set(history.map((entry) => key(entry.design)));
        const candidates = generate(kept(), ++generation).filter((design) => !reviewed.has(key(design)));
        const recent = history.slice(-1000);
        candidates.sort((a, b) => score(b, recent) - score(a, recent));
        // Keep a few less familiar results so preferences do not collapse to one look.
        const selected = [...candidates.slice(0, 9), ...candidates.slice(-3)];
        const seen = new Set(queue.map(key));
        for (const design of selected) if (!seen.has(key(design))) { queue.push(design); seen.add(key(design)); }
      } finally { busy = false; refresh(); }
    };
    action('export').onclick = async () => {
      busy = true; refresh();
      try {
        const entries = history.filter((entry) => entry.keep);
        const images = [], models = [];
        for (const entry of entries) {
          const blob = await savedImage(entry);
          if (entry.imageId && !blob) throw new Error('A saved image is missing. Remove that item or restore it before exporting.');
          images.push(blob);
          const model = await savedModel(entry);
          if (entry.hasModel && !model) throw new Error('A saved 3D model is missing. Restore your downloaded ZIP or remove that item.');
          models.push(model);
        }
        await exportDesigns(entries.map((entry) => entry.design), images, models);
      }
      catch (error) { alert(`Basket export failed: ${error.message}`); }
      finally { busy = false; refresh(); }
    };
    action('backup').onclick = () => {
      if (busy) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'guitar-finish-review', version: 1, history }, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'guitar-review-decisions.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    action('clear').onclick = () => {
      if (busy) return;
      if (!confirm('Clear all saved keep/pass decisions and learned preferences? Download your kept designs or back up decisions first.')) return;
      for (const entry of history) if (entry.imageId) for (const id of [entry.imageId, entry.imageId + '-glb']) void imageStore('delete', id).catch(() => {});
      sessionImages.clear();
      history = []; undo = []; save(); refresh();
    };
    action('restore').onclick = () => find('.review-restore').click();
    find('.review-restore').onchange = async (event) => {
      const file = event.target.files[0]; if (!file || busy) return;
      busy = true; refresh();
      try {
        if (file.size > 20_000_000) throw new Error('size');
        const data = JSON.parse(await file.text());
        if (data.format !== 'guitar-finish-review' || data.version !== 1 || !Array.isArray(data.history)
          || !data.history.every((entry) => entry && typeof entry.keep === 'boolean' && validate(entry.design))) throw new Error('format');
        const merged = new Map(history.map((entry) => [key(entry.design), entry]));
        for (const entry of data.history) {
          const existing = merged.get(key(entry.design));
          // JSON backups contain recipes, not image data. Preserve this browser's
          // existing snapshot, never claim a foreign snapshot ID is available.
          merged.set(key(entry.design), { design: entry.design, keep: entry.keep,
            ...(existing?.imageId ? { imageId: existing.imageId, hasModel: existing.hasModel } : {}) });
        }
        history = [...merged.values()]; undo = [];
        queue = queue.filter((design) => !merged.has(key(design))); save();
        busy = false; refresh();
      } catch {
        busy = false; refresh();
        find('.review-status').textContent = 'Could not restore: choose a valid review recipe backup under 20 MB.';
      }
      event.target.value = '';
    };
    card.addEventListener('keydown', (event) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); decide(event.key === 'ArrowRight'); }
    });
    let start = null;
    const resetGesture = () => { start = null; preview.style.transform = ''; find('.review-gesture').textContent = ''; };
    card.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0 || !queue.length || busy) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId }; card.setPointerCapture(event.pointerId);
    });
    card.addEventListener('pointermove', (event) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) preview.style.transform = `translateX(${Math.max(-90, Math.min(90, dx))}px) rotate(${dx / 30}deg)`;
      find('.review-gesture').textContent = Math.abs(dx) < 60 ? '' : dx > 0 ? 'KEEP →' : '← PASS';
    });
    card.addEventListener('pointerup', (event) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x; const dy = event.clientY - start.y;
      resetGesture(); if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) decide(dx > 0);
    });
    card.addEventListener('pointercancel', resetGesture);
    card.addEventListener('lostpointercapture', resetGesture);
    refresh();
    return {
      add(designs) {
        const seen = new Set([...queue.map(key), ...history.map((entry) => key(entry.design))]);
        for (const design of designs) if (!seen.has(key(design))) { queue.push({ ...design }); seen.add(key(design)); }
        refresh();
      },
      refresh,
    };
  }
  globalThis.GuitarReview = { mount, distance, score, key };
})();
