/* Presentation only: move existing controls without replacing their state/listeners. */
(() => {
  const el=id=>document.getElementById(id);
  const controls=document.querySelector('.controls'), mesh=document.querySelector('.mesh-card');
  controls.prepend(mesh);
  el('model-stage').append(el('mesh-preview'));
  el('model-export').append(el('mesh-status'),el('export-game-asset'));
  el('preview-mesh').textContent='Refresh model';
  el('preview-mesh').classList.replace('button-primary','button-secondary');
  el('model-export').append(el('preview-mesh'));
  const notes=document.createElement('details');notes.className='advanced-settings';
  const summary=document.createElement('summary');summary.textContent='About geometry and finishes';notes.append(summary);
  mesh.querySelectorAll(':scope > p.help').forEach(paragraph=>notes.append(paragraph));
  mesh.append(notes);
  const collection=document.querySelector('.batch-card');
  const gallery=document.createElement('details');gallery.className='advanced-settings';
  const galleryTitle=document.createElement('summary');galleryTitle.textContent='Browse generated thumbnails';gallery.append(galleryTitle);
  el('batch-gallery').before(gallery);gallery.append(el('batch-gallery'));
  const review=document.querySelector('.review-panel');
  review.dataset.surface='collection'; review.classList.add('card');
  controls.append(review);
  // These switches affect collection generation, not the current model.
  collection.querySelector('.help').after(el('review-3d').closest('label'),el('vary-construction').closest('label'));
  el('review-3d').addEventListener('input',()=>el('preview-mesh').click());
  const descriptions={
    build:'Choose a shape and finish. The large preview is the actual exported 3D model. No animation or rig.',
    collection:'Generate → keep or pass → download your basket. Change the base guitar and colors in 3D builder; photo collections use Photo editor.',
    photo:'Recolor an image and export a PNG. This separate 2D editor does not reconstruct a 3D model.',
  };
  function show(mode) {
    document.body.dataset.workspace=mode;
    document.querySelectorAll('[data-surface]').forEach(panel=>panel.hidden=!panel.dataset.surface.split(' ').includes(mode));
    document.querySelectorAll('.workspace-nav button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.workspace===mode)));
    el('workspace-help').textContent=descriptions[mode];
    if(mode==='build') el('preview-mesh').click();
  }
  document.querySelectorAll('.workspace-nav button').forEach(button=>button.addEventListener('click',()=>show(button.dataset.workspace)));
  // File pickers remain accessible to keyboard users, unlike hidden label-only inputs.
  document.querySelectorAll('label[for]').forEach(label=>{
    const input=el(label.htmlFor); if(input?.type!=='file')return;
    label.tabIndex=0;label.setAttribute('role','button');
    label.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();input.click();}});
  });
  show('build');
})();
