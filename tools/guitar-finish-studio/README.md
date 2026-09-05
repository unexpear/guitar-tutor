# Guitar Finish Studio

A dependency-free browser tool for designing original guitar finishes. Images are processed locally in the browser and are never uploaded.

## Use it

Open `index.html` in a current browser, or run the repository's local preview command. Import a transparent PNG or WebP, use the Protect brush on hardware, adjust the paint layers, and export a transparent PNG.

The built-in samples are deliberately simple demonstrations. Users are responsible for having permission to modify and redistribute imported artwork.

### Rule-based batches

The Batch Lab creates 2–36 deterministic variations using color-harmony, finish, pattern, minimum-separation, quantity, and seed rules. Batch export produces a single ZIP containing transparent PNGs and a `manifest.json` with the exact rules and recipes required to reproduce the collection.

### Swipe review and suggestions

Generate a batch, then review the larger card below the gallery. Swipe right to keep
or left to pass. Buttons and left/right arrow keys on the focused card provide the
same controls. Undo restores the last decision. Small drags and vertical scrolling
do not count as decisions; reduced-motion preferences suppress card movement.

Keep/pass recipes persist in this browser (up to 1,000 decisions). Artwork and masks
are not stored: previews and kept PNG exports use the currently loaded guitar and
mask, including imported photoreal images. Back up decisions before clearing browser
data. Restore decisions merges a validated backup into the current history. If
storage is blocked, review still works for the session and displays a warning.

“Suggest similar finishes” generates candidates around recent approved colors using
the current batch rules, then ranks them with five distance-weighted nearby keep/pass
examples. Color, finish, pattern and texture settings influence ranking; a few less
familiar candidates remain for exploration. This is a lightweight local preference
recommender, not an image-quality model. It cannot identify malformed guitars or
judge realism. Changing the batch seed explores new candidates.

“Download kept PNGs + recipes” exports only kept finishes as a ZIP. Each exact recipe
is in the manifest; it does not require an account, model download or network access.

### Static 3D mesh export

The beta mesh exporter produces an actual low-poly Wavefront OBJ with UV coordinates and named body, tapered neck, headstock, nut, bridge, fret, hardware, and string objects. Start with one of four construction blueprints: steel-string dreadnought, 25.5-inch double-cut electric, 24.75-inch single-cut electric, or 34-inch bass. Advanced controls expose handedness, string count, pickup layout, scale length, fret count, nut width, bridge spacing, and body depth.

Fret centers are calculated from the nut using equal-tempered scale positions, so the 12th fret is half the selected scale length. The exported `mesh-info.json` records every fret's nut-relative position and the source dimensions. Left-handed export mirrors the asymmetric body, controls, headstock, and finish texture together.

Its ZIP also includes an MTL material library, the current transparent finish texture, and machine-readable mesh metadata. It intentionally exports static geometry without an armature or animation. The generated shape is a clean visual/game starting point for Blender or a game engine, not a manufacturing drawing, acoustically simulated instrument, or replacement for hand-authored production topology.

### Construction references

The presets are based on published manufacturer dimensions rather than one generic guitar shape:

- [Martin D-28](https://www.martinguitar.com/10Y25D28.html): 25.4-inch scale, 20 frets, 14th-fret neck joint, 1 3/4-inch nut, and 2 5/32-inch bridge string spacing.
- [Fender American Professional II Stratocaster](https://www.fender.com/products/american-professional-ii-stratocaster): 25.5-inch scale, 22 frets, and 1.685-inch nut.
- [Fender American Professional Classic Precision Bass](https://www.fender.com/products/american-professional-classic-precision-bass): 34-inch scale, 20 frets, and 1.625-inch nut.
- [Gibson Custom 1959 Les Paul specification sheet](https://images.gibson.com/Products/Electric-Guitars/2018/Custom/59-LP-Standard/Documents/59-LP-Standard-One-Sheet.pdf): 24.75-inch scale, 22 frets, and 42.85 mm nut.
- [StewMac fret position calculator](https://www.stewmac.com/fret-calculator/): fret measurements run from the nut face to the center of each fret slot; measuring each position from the nut avoids accumulated error.

Published scale, fret, nut, bridge-spacing, string-count, and pickup-layout values are followed where cited. Low-poly body outlines, unspecified depths, neck-joint locations for the electric presets, and decorative hardware placement remain visual approximations; verify a real instrument plan before fabrication.

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
