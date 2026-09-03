export const FINISH_FAMILIES = ['wood', 'metallic', 'crystal'];

export const PAINT_FINISHES = [
  'gloss',
  'matte',
  'metallic-flake',
  'pearlescent',
  'brushed',
  'carbon-weave',
];

export const PAINT_PRESETS = [
  { id: 'cherry-racing', name: 'Cherry Racing', primary: '#A51931', accent: '#FFD166', primaryFinish: 'gloss', accentFinish: 'metallic-flake', pattern: 'center-stripe' },
  { id: 'aurora-pearl', name: 'Aurora Pearl', primary: '#4568DC', accent: '#B06AB3', primaryFinish: 'pearlescent', accentFinish: 'gloss', pattern: 'split' },
  { id: 'midnight-weave', name: 'Midnight Weave', primary: '#151827', accent: '#59D9FF', primaryFinish: 'matte', accentFinish: 'carbon-weave', pattern: 'edge-burst' },
  { id: 'solar-flake', name: 'Solar Flake', primary: '#D98516', accent: '#FFF0A1', primaryFinish: 'metallic-flake', accentFinish: 'gloss', pattern: 'pinstripes' },
  { id: 'ocean-brushed', name: 'Ocean Brushed', primary: '#145DA0', accent: '#7DE2D1', primaryFinish: 'brushed', accentFinish: 'pearlescent', pattern: 'center-stripe' },
  { id: 'forest-carbon', name: 'Forest Carbon', primary: '#176B45', accent: '#B8FF55', primaryFinish: 'carbon-weave', accentFinish: 'matte', pattern: 'split' },
];

export const GUITAR_MODEL_PIPELINE = [
  {
    id: 'acoustic-cutaway',
    guitarType: 'acoustic',
    sources: {
      wood: 'art/guitar-models/acoustic-cutaway-wood.png',
      metallic: 'art/guitar-models/acoustic-cutaway-metallic.png',
      crystal: 'art/guitar-models/acoustic-cutaway-crystal.png',
    },
    headstockCrop: { left: 196, top: 0, width: 120, height: 180 },
    paintZones: {
      body: 'M 184 379 C 154 379 148 415 156 458 C 164 499 123 540 115 610 C 108 684 161 730 256 739 C 351 730 402 682 392 610 C 384 552 346 506 351 468 C 358 432 343 410 315 410 C 292 410 284 394 276 379 Z',
      headstock: 'M 224 18 C 242 10 273 10 290 20 L 298 119 C 297 132 286 139 276 143 L 238 143 C 228 139 217 132 216 119 Z',
      exclusions: '<rect x="237" y="132" width="42" height="365"/><circle cx="256" cy="494" r="41"/><rect x="207" y="585" width="100" height="27" rx="7"/><circle cx="239" cy="55" r="8"/><circle cx="274" cy="55" r="8"/><circle cx="239" cy="88" r="8"/><circle cx="274" cy="88" r="8"/><circle cx="239" cy="121" r="8"/><circle cx="274" cy="121" r="8"/>',
    },
  },
  {
    id: 'electric-singlecut',
    guitarType: 'electric',
    sources: {
      wood: 'art/guitar-models/electric-singlecut-wood.png',
      metallic: 'art/guitar-models/electric-singlecut-metallic.png',
      crystal: 'art/guitar-models/electric-singlecut-crystal.png',
    },
    headstockCrop: { left: 196, top: 0, width: 120, height: 180 },
    paintZones: {
      body: 'M 187 418 C 156 413 148 451 151 504 C 154 552 128 600 133 662 C 138 718 184 739 259 742 C 338 739 382 713 384 660 C 387 598 364 548 366 504 C 369 470 356 444 335 449 C 307 456 297 485 271 490 L 253 490 C 233 466 215 425 187 418 Z',
      headstock: 'M 274 7 C 282 10 286 18 285 29 L 283 108 L 271 136 L 236 136 L 230 119 C 242 99 254 49 274 7 Z',
      exclusions: '<rect x="241" y="245" width="42" height="260"/><rect x="227" y="496" width="61" height="36" rx="5"/><rect x="227" y="570" width="61" height="36" rx="5"/><rect x="229" y="615" width="58" height="29" rx="4"/><circle cx="331" cy="599" r="10"/><circle cx="350" cy="635" r="7"/><circle cx="332" cy="669" r="10"/><circle cx="260" cy="35" r="7"/><circle cx="257" cy="51" r="7"/><circle cx="254" cy="67" r="7"/><circle cx="250" cy="83" r="7"/><circle cx="247" cy="99" r="7"/><circle cx="243" cy="115" r="7"/>',
    },
  },
];
