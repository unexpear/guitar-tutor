/* Local recipe review and an example-based preference ranker. No image model or network. */
(() => {
  'use strict';
  const fields = ['primary', 'accent', 'primaryFinish', 'accentFinish', 'pattern', 'textureStrength', 'patternScale', 'seed'];
  const key = (design) => fields.map((field) => design[field]).join('|');
  const colorDistance = (a, b) => {
    const channels = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
    const x = channels(a); const y = channels(b);
    return x.reduce((sum, value, i) => sum + (value - y[i]) ** 2, 0) / 3;
  };
  function distance(a, b) {
    return colorDistance(a.primary, b.primary) + colorDistance(a.accent, b.accent)
      + ['primaryFinish', 'accentFinish', 'pattern'].reduce((sum, field) => sum + (a[field] === b[field] ? 0 : .4), 0)
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

  function mount({ host, render, generate, exportDesigns, validate }) {
    const storageKey = 'guitar-finish-review-v1';
    let history = []; let queue = []; let undo = []; let busy = false; let storageWorks = true;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(stored)) history = stored.filter((entry) => entry && typeof entry.keep === 'boolean' && validate(entry.design)).slice(-1000);
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
      <button type="button" class="button button-secondary wide-button" data-action="suggest">Suggest similar finishes</button>
      <p class="help review-explanation">Suggestions learn from nearby colors, finishes and patterns in your decisions. They do not assess photo quality or guitar construction. Batch rules still apply.</p>
      <button type="button" class="button button-secondary wide-button" data-action="export">Download kept PNGs + recipes</button>
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
      try { localStorage.setItem(storageKey, JSON.stringify(history)); storageWorks = true; }
      catch { storageWorks = false; }
    }
    function refresh() {
      const design = queue[0];
      card.hidden = !design;
      if (design) render(preview, design);
      find('.review-description').textContent = design
        ? `${design.primaryFinish} / ${design.accentFinish} · ${design.pattern} · ${design.primary} + ${design.accent}`
        : 'Generate a batch to review, or request suggestions after keeping a finish.';
      find('.review-status').textContent = `${queue.length} to review · ${kept().length} kept · ${history.filter((entry) => !entry.keep).length} passed. ${storageWorks ? 'Decisions saved in this browser.' : 'Storage unavailable: back up decisions before closing.'}`;
      action('keep').disabled = action('pass').disabled = !design || busy;
      action('undo').disabled = !undo.length || busy;
      action('suggest').disabled = !kept().length || busy;
      action('export').disabled = !kept().length || busy;
      action('clear').disabled = !history.length || busy;
    }
    function decide(keep) {
      if (!queue.length || busy) return;
      if (history.length >= 1000) { find('.review-status').textContent = 'Review storage is full. Export and back up your decisions, then clear them to continue.'; return; }
      const design = queue.shift();
      const previous = history.find((entry) => key(entry.design) === key(design));
      history = history.filter((entry) => key(entry.design) !== key(design));
      history.push({ design, keep }); undo.push({ design, previous }); save(); refresh();
    }
    action('keep').onclick = () => decide(true);
    action('pass').onclick = () => decide(false);
    action('undo').onclick = () => {
      const entry = undo.pop(); if (!entry || busy) return;
      history = history.filter((item) => key(item.design) !== key(entry.design));
      if (entry.previous) history.push(entry.previous);
      queue.unshift(entry.design); save(); refresh();
    };
    action('suggest').onclick = async () => {
      if (busy || !kept().length) return;
      busy = true; refresh();
      try {
        const reviewed = new Set(history.map((entry) => key(entry.design)));
        const candidates = generate(kept()).filter((design) => !reviewed.has(key(design)));
        candidates.sort((a, b) => score(b, history) - score(a, history));
        // Keep a few less familiar results so preferences do not collapse to one look.
        const selected = [...candidates.slice(0, 9), ...candidates.slice(-3)];
        const seen = new Set(queue.map(key));
        for (const design of selected) if (!seen.has(key(design))) { queue.push(design); seen.add(key(design)); }
      } finally { busy = false; refresh(); }
    };
    action('export').onclick = async () => {
      busy = true; refresh();
      try { await exportDesigns(kept()); }
      finally { busy = false; refresh(); }
    };
    action('backup').onclick = () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'guitar-finish-review', version: 1, history }, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'guitar-review-decisions.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    action('clear').onclick = () => {
      if (!confirm('Clear all saved keep/pass decisions and learned preferences? Download your kept designs or back up decisions first.')) return;
      history = []; undo = []; save(); refresh();
    };
    action('restore').onclick = () => find('.review-restore').click();
    find('.review-restore').onchange = async (event) => {
      const file = event.target.files[0]; if (!file || busy) return;
      try {
        if (file.size > 2_000_000) throw new Error('size');
        const data = JSON.parse(await file.text());
        if (data.format !== 'guitar-finish-review' || data.version !== 1 || !Array.isArray(data.history)
          || data.history.length > 1000 || !data.history.every((entry) => entry && typeof entry.keep === 'boolean' && validate(entry.design))) throw new Error('format');
        const merged = new Map(history.map((entry) => [key(entry.design), entry]));
        for (const entry of data.history) merged.set(key(entry.design), { design: entry.design, keep: entry.keep });
        if (merged.size > 1000) throw new Error('capacity');
        history = [...merged.values()]; undo = [];
        queue = queue.filter((design) => !merged.has(key(design))); save(); refresh();
      } catch { find('.review-status').textContent = 'Could not restore: choose a valid review backup with at most 1,000 combined decisions.'; }
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
