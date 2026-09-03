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

// Ten existing locker designs per instrument family. Each recipe is baked for
// both shapes in its family, producing 4 shapes x 10 player-visible skins.
export const PLAYER_SKIN_RECIPES = [
  { designId: 'starter-1', guitarType: 'acoustic', primary: '#7D4727', accent: '#D6A16A', primaryFinish: 'gloss', accentFinish: 'matte', pattern: 'edge-burst' },
  { designId: 'starter-3', guitarType: 'acoustic', primary: '#9E293B', accent: '#FF9AA5', primaryFinish: 'gloss', accentFinish: 'metallic-flake', pattern: 'center-stripe' },
  { designId: 'starter-5', guitarType: 'acoustic', primary: '#30633B', accent: '#9FD5A7', primaryFinish: 'matte', accentFinish: 'gloss', pattern: 'split' },
  { designId: 'starter-7', guitarType: 'acoustic', primary: '#5D3475', accent: '#D7A7EF', primaryFinish: 'pearlescent', accentFinish: 'gloss', pattern: 'edge-burst' },
  { designId: 'starter-9', guitarType: 'acoustic', primary: '#C59C66', accent: '#FFF0CF', primaryFinish: 'gloss', accentFinish: 'matte', pattern: 'pinstripes' },
  { designId: 'level-1', guitarType: 'acoustic', primary: '#45A991', accent: '#D8FFF5', primaryFinish: 'pearlescent', accentFinish: 'gloss', pattern: 'center-stripe' },
  { designId: 'level-3', guitarType: 'acoustic', primary: '#6541B6', accent: '#E4D4FF', primaryFinish: 'metallic-flake', accentFinish: 'pearlescent', pattern: 'split' },
  { designId: 'level-5', guitarType: 'acoustic', primary: '#99502D', accent: '#FFD0AA', primaryFinish: 'brushed', accentFinish: 'gloss', pattern: 'edge-burst' },
  { designId: 'level-7', guitarType: 'acoustic', primary: '#D39B16', accent: '#FFF5B5', primaryFinish: 'metallic-flake', accentFinish: 'gloss', pattern: 'center-stripe' },
  { designId: 'level-9', guitarType: 'acoustic', primary: '#127E87', accent: '#A1FFF7', primaryFinish: 'brushed', accentFinish: 'pearlescent', pattern: 'pinstripes' },
  { designId: 'starter-2', guitarType: 'electric', primary: '#292B3B', accent: '#9498B8', primaryFinish: 'matte', accentFinish: 'metallic-flake', pattern: 'edge-burst' },
  { designId: 'starter-4', guitarType: 'electric', primary: '#235B9A', accent: '#8DC5FF', primaryFinish: 'gloss', accentFinish: 'pearlescent', pattern: 'center-stripe' },
  { designId: 'starter-6', guitarType: 'electric', primary: '#A66A1E', accent: '#FFE080', primaryFinish: 'metallic-flake', accentFinish: 'gloss', pattern: 'split' },
  { designId: 'starter-8', guitarType: 'electric', primary: '#435064', accent: '#BAC8D8', primaryFinish: 'brushed', accentFinish: 'matte', pattern: 'pinstripes' },
  { designId: 'starter-10', guitarType: 'electric', primary: '#B43A3A', accent: '#FFD092', primaryFinish: 'gloss', accentFinish: 'metallic-flake', pattern: 'edge-burst' },
  { designId: 'level-2', guitarType: 'electric', primary: '#D32F2F', accent: '#FFC0B5', primaryFinish: 'metallic-flake', accentFinish: 'gloss', pattern: 'center-stripe' },
  { designId: 'level-4', guitarType: 'electric', primary: '#78BFA0', accent: '#FFFFFF', primaryFinish: 'gloss', accentFinish: 'pearlescent', pattern: 'split' },
  { designId: 'level-6', guitarType: 'electric', primary: '#202B6C', accent: '#92A4FF', primaryFinish: 'carbon-weave', accentFinish: 'metallic-flake', pattern: 'edge-burst' },
  { designId: 'level-8', guitarType: 'electric', primary: '#BD607E', accent: '#FFE3EB', primaryFinish: 'pearlescent', accentFinish: 'gloss', pattern: 'pinstripes' },
  { designId: 'level-10', guitarType: 'electric', primary: '#491529', accent: '#DC7895', primaryFinish: 'carbon-weave', accentFinish: 'metallic-flake', pattern: 'center-stripe' },
];

export const GUITAR_MODEL_PIPELINE = [
  {
    id: 'acoustic-grand',
    assetStem: 'acoustic',
    guitarType: 'acoustic',
    preserveBaseAssets: true,
    sources: { wood: 'assets/guitars/acoustic-wood.png' },
    headstockCrop: { left: 196, top: 0, width: 120, height: 180 },
    paintZones: {
      body: 'M 184 394 C 156 394 151 425 161 456 C 172 490 131 542 131 607 C 131 682 179 720 256 730 C 333 720 381 682 381 607 C 381 542 340 490 351 456 C 361 425 356 394 328 394 C 297 394 282 413 256 413 C 230 413 215 394 184 394 Z',
      headstock: '',
      exclusions: '<rect x="230" y="120" width="52" height="410"/><circle cx="256" cy="492" r="49"/><rect x="190" y="578" width="132" height="45" rx="8"/>',
    },
  },
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
    id: 'electric-doublecut',
    assetStem: 'electric',
    guitarType: 'electric',
    preserveBaseAssets: true,
    sources: { wood: 'assets/guitars/electric-wood.png' },
    headstockCrop: { left: 176, top: 0, width: 120, height: 180 },
    paintZones: {
      body: 'M 179 451 C 154 442 143 468 141 509 C 136 562 120 593 123 658 C 125 713 177 737 256 739 C 335 737 387 713 389 658 C 392 593 376 562 371 509 C 369 468 358 442 333 451 C 305 461 289 490 256 490 C 223 490 207 461 179 451 Z',
      headstock: '',
      exclusions: '<rect x="195" y="105" width="64" height="430"/><rect x="174" y="492" width="104" height="145" rx="7"/><rect x="174" y="632" width="112" height="70" rx="6"/><circle cx="302" cy="586" r="13"/><circle cx="315" cy="643" r="13"/><circle cx="299" cy="690" r="13"/>',
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
