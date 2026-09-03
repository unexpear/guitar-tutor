# Guitar Finish Studio

A dependency-free browser tool for designing original guitar finishes. Images are processed locally in the browser and are never uploaded.

## Use it

Open `index.html` in a current browser, or run the repository's local preview command. Import a transparent PNG or WebP, use the Protect brush on hardware, adjust the paint layers, and export a transparent PNG.

The built-in samples are deliberately simple demonstrations. Users are responsible for having permission to modify and redistribute imported artwork.

### Rule-based batches

The Batch Lab creates 2–36 deterministic variations using color-harmony, finish, pattern, minimum-separation, quantity, and seed rules. Batch export produces a single ZIP containing transparent PNGs and a `manifest.json` with the exact rules and recipes required to reproduce the collection.

### Static 3D mesh export

The beta mesh exporter produces an actual low-poly Wavefront OBJ with UV coordinates and named body, neck, headstock, bridge, and string objects. Its ZIP also includes an MTL material library, the current transparent finish texture, and machine-readable mesh metadata. It intentionally exports static geometry without an armature or animation. The generated shape is a clean starting point for Blender or a game engine, not a replacement for hand-authored production topology.

The studio recognizes this project's `acoustic-cutaway-*` and `electric-singlecut-*` photoreal filenames and automatically applies their fitted paint/hardware masks. Other imported images use the visible silhouette and can be corrected with the Protect/Paint brushes or a custom mask.

## itch.io release

Run `npm run guitars:studio:package` on Windows. Upload `dist-itch/guitar-finish-studio.zip` as an HTML project. The archive contains `index.html` at its root and only uses relative paths.

Recommended itch.io settings:

- Kind: HTML
- Embed: Click to launch in fullscreen
- Mobile friendly: enabled
- Orientation: any

## Controls

- Preview: disables mask painting.
- Protect: removes areas from the paint mask.
- Paint: restores areas to the paint mask.
- Ctrl/Cmd+Z: undo the latest mask stroke.
- Recipes store colors, finishes, pattern, scale, intensity, and seed. They intentionally exclude source artwork and masks.

## Browser support

The studio uses Canvas 2D, `createImageBitmap`, pointer events, and `canvas.toBlob`. Current Chrome, Edge, Firefox, and Safari are recommended.
