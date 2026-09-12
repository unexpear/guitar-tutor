# Offline 3D guitars and free gifts

The tuner now uses a local WebView/WebGL Three.js scene, sharing `build()` with
Guitar Finish Studio. These are actual static meshes, generated from saved recipes;
not a photograph or a GLB file download. The existing studio can export that
geometry as GLB. The phone camera is stationary and frames the complete guitar.
Only scene changes render frames; there is no continuous animation loop.

The bundle contains its code and generates textures locally. No CDN, external
navigation, microphone access or network fetch is required by the scene. WebGL
failure/time-out falls back to an explicitly labeled image preview. The native
tuner and reference audio remain outside the WebView. A new native build is
required for `react-native-webview`; an older installed APK cannot gain it via JS.

## Rebuild

From the repository root, after `npm ci --prefix tools/guitar-finish-studio`:

```
node tools/guitar-finish-studio/build-mobile.mjs
npm --prefix tools/guitar-finish-studio run build
```

Commit the generated `mobileGuitarHtml.json` and studio bundle with their source
changes. The mobile build extracts the same five body outlines used by the studio.
The existing four phone guitar model IDs map to their corresponding mesh profiles.
Three.js MIT license is retained inline in the bundle and in the studio license.

## Free daily gift rules

- One local-calendar-day check-in, initiated with Open free guitar gift.
- Common 50%, Rare 30%, Epic 15%, Legendary 5% on ordinary days.
- Every seventh consecutive check-in promotes Common to Rare: that day's odds
  are Rare 80%, Epic 15%, Legendary 5%.
- No purchases, ads, paid rerolls, cash value, trading or loss of collected items.
- Saved seed, palette, model and rarity reproduce each awarded guitar.
- Check-in streak is separate from practice streak/XP. Existing 10 starter and
  30 level finishes remain available through the same progression rules.
- Same-day and backwards-clock claims are ignored. Offline local data is not
  cheat-proof; resetting app data resets gifts too. No server anti-cheat is used.
- Higher tiers add binding/inlay variants, rosette detail and premium trim/hardware.
  Basic guitars are still finished instruments, not intentionally broken assets.

## Material and geometry refinement (September 6)

- Shared procedural material maps now mask clearcoat per region. Pearl and brushed
  finishes enable iridescence / anisotropy only when selected, with local masks.
- Wood is an explicitly procedural approximation: longitudinal fibers, irregular
  bookmatched figure and zone-line approximations, not scanned species textures.
  Grain does not deeply emboss lacquer or strongly alternate its roughness.
- Burst falloff follows the body's outline rather than a generic circular mask.
- Phone recipes derive body variation and wood family from the saved seed within
  rarity limits, rather than forcing pearl paint. Standard uses matte, restrained
  grain and simple contours; Rare adds figured wood, binding and soft sheen;
  Epic adds fretboard binding, intricate inlays and stronger polish; Legendary
  allows the full figure/contour set, purfling, gold hardware and extra headstock
  ornament. Clearcoat caps are 0 / .35 / .7 / 1, with progressively sharper gloss.
  These are cosmetic rules only: existing rewards, unlocks and odds are unchanged.
- Neck pickups clear the actual fretboard; paired tuners have nut-to-post string
  runs, collars and tiered inlays. Higher tiers add rosette marquetry, pickup covers,
  purfling and gold hardware. Existing four model families are retained.
- Phone maps remain 256 square, DPR capped at 2, LOD1 and render-on-change.
  Regression checks bound tested presets to 25,000 triangles / 180 meshes.
  The displayed Legendary electric measured 4,744 triangles and 108 scene draw
  calls in desktop Chromium. This is not a phone frame-rate measurement.
- Research references are for construction/material study only; no manufacturer
  photos, logos or traced branded geometry were imported. CC0 texture candidates:
  https://docs.ambientcg.com/license/ and https://polyhaven.com/license.

### Remaining device checks

Material library now offers 14 choices, retaining all six legacy names. Additions:
Solid Gloss, Solid Satin, Solid Matte, Rough Paint, Open Pore Wood, Hammered Metal,
Polished Metal and Satin Metal. The picker and recipe validation use the exported
shared list. Batch glossy/textured pools include the new finishes. Phone rewards
include solid and rough variants within their rarity policy, without enabling
additional pearl/anisotropy shader features there.

Solid color, relief and roughness are separate signals; opaque solids never inherit
wood grain. All finish channels blend with the same accent mask. Browser checks
cover all 14 choices and controlled-light renders at two light positions; metal,
gloss, satin and matte have visibly different highlight responses. The tool's
image-only preview remains a flat approximation, explicitly labeled in its help.
Material behavior references: https://threejs.org/docs/pages/MeshPhysicalMaterial.html
and https://threejs.org/docs/pages/MeshStandardMaterial.html.

GLB export now registers a local KHR_materials_anisotropy writer because the
installed Three r185 exporter omits this property. Brushed-metal direction,
strength and texture are preserved alongside the existing clearcoat/pearl maps.
All 14 finish exports were reloaded in the browser and checked with the Khronos
validator: zero errors/warnings, no animations or skins, no external files.
Saved finish metadata survived the round trip. Importing engines must support
the corresponding KHR material extensions to reproduce those effects.
Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy

Texture refinement: flame-family figure and longitudinal fibers now use irregular
seeded noise rather than evenly spaced sine bands. Pearl uses fine mica-like
variation independent of wood families; metallic flake is sparse rather than
full-surface noise. Open pores are separate recessed details and hammered metal
uses rounded cellular impressions. Texture dimensions and mesh budgets are
unchanged. Controlled-light browser swatches were inspected; these remain
procedural approximations, not scanned wood or measured automotive paint.

## Captured wood foundation

The latest pass replaces the synthetic-only grain foundation with ambientCG
Wood062 (CC0, photographic/photometric-stereo source). See the studio's
CAPTURED-MATERIALS.md and source hashes in captured-wood.json. It is not a named
maple species or a scan of every figure family. Artificial figure remains subtle
and is layered over the captured grain where selected.

Three 256-square channels are embedded as packed bytes: color luminance, height,
roughness. No runtime network, image decoding or extra geometry is needed. The
offline scene grew from 592,222 to 855,801 bytes. Neck/fretboard each use a separate
256-square color map; coordinates now fit each part and side walls have a
non-collapsed wrap. Existing finishes, rarities and model choices are retained.

Close-up browser render: output/playwright/captured-closeup.png. One initial
WebGL context failure occurred; reloading succeeded. Physical-device reliability
is not established by the browser pass. Body contours/pickguard/hardware still
need refinement; this is not a completed photorealism claim.

Browser rendering is checked separately from geometry and reward arithmetic.
Physical Android WebView startup, memory/background lifecycle, microphone
coexistence and phone-sized visual approval still need release-based owner testing.
This is a procedural 3D quality pass, not a claim of photorealistic rendering.

References: https://docs.expo.dev/versions/v57.0.0/sdk/webview/
and https://threejs.org/docs/pages/MeshPhysicalMaterial.html
