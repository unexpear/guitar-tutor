# Guitar model source pipeline

Add one transparent 512×768 wood source to this folder, then add its model entry to
`scripts/guitar-models.config.mjs`. Run `npm run guitars:generate` to create the optimized
full-guitar and headstock assets for every finish.

For highest fidelity, provide `wood`, `metallic`, and `crystal` source renders. If metallic
or crystal is omitted, the tool creates that family procedurally from the wood source.
Use `npm run guitars:check` in CI or before a release to catch missing dimensions, missing
alpha, opaque backgrounds, or incomplete model families.

Generated assets belong in `assets/guitars`, where Expo bundles their static `require()`
references. New models must also be registered in `features/progression/guitarModels.ts`
and `features/progression/guitarModelAssets.ts` so they appear in the picker.

## Layered paint system

`npm run guitars:paint` builds every configured model with every paint preset. Each
recipe keeps the physical model, primary color and finish, accent color and finish,
and accent pattern independent.

Paint is masked to the body and headstock, preserving strings, fretboard, pickups,
bridge, knobs, and tuning hardware. Deterministic previews are written to the ignored
`art/guitar-models/paint-previews` folder.

Filter a large batch while working:

```powershell
npm run guitars:paint -- --model acoustic-cutaway
npm run guitars:paint -- --preset aurora-pearl
npm run guitars:paint -- --model electric-singlecut --preset midnight-weave
```

Add original recipes to `PAINT_PRESETS` in `scripts/guitar-models.config.mjs`. Available
materials are gloss, matte, metallic flake, pearlescent, brushed, and carbon weave.
Available accent masks are center stripe, split, edge burst, and pinstripes. The tool
rejects unsafe names, malformed colors, unknown finishes, missing output, opaque
backgrounds, and incorrect dimensions.

## Bundled player skins

`npm run guitars:skins` generates ten shape-specific PNG skins for each of the four
player-selectable guitar models. Unlike paint previews, these files are committed under
`assets/guitars/player-skins` and statically registered for Expo bundling. The existing
wood, metallic, and crystal model assets remain available as fallback for every other
locker design. Run `npm run guitars:skins:check` before release.
