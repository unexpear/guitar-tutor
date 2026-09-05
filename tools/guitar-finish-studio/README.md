# Guitar Finish Studio

A self-contained browser tool for designing guitar finishes and static 3D assets. Three.js is bundled locally. Images are processed in the browser and are never uploaded.

## Use it

### Windows desktop executable

The native desktop distribution is `dist-itch/windows/Guitar-Finish-Studio-0.1.0-Windows-x64.exe`.
Run it directly on 64-bit Windows. Electron and Chromium are bundled: no browser,
Node, Python, local server or internet connection is required. It opens its own
desktop window, with native import/save dialogs. This is a portable executable,
not an installer; first launch extracts its runtime to a temporary directory.

The basket lives under `%APPDATA%/GuitarFinishStudio`, independently of browser
baskets and independently of the EXE's location. Export browser baskets before
switching; recipe backups alone do not include the saved artwork/models.
The initial executable is unsigned and may trigger Windows SmartScreen or
unknown-publisher warnings. It has no auto-updater. Do not disable Windows
security protections to run it. Public distribution should include a signed build.

For itch, upload the EXE as a **downloadable Windows tool**, not as a browser-playable
HTML ZIP. The HTML ZIP remains an optional separate edition. Nothing is published
by the build: `npm ci` then `npm run desktop:build` inside this tool directory
creates the Windows artifact with publishing disabled. `npm run desktop` runs
the desktop app during development.

Desktop security: sandboxed/context-isolated renderer, no Node integration or
preload bridge, an allowlisted local protocol, blocked external networking and
navigation, denied permissions, and a restrictive script policy. Exports use the
native save dialog. `--smoke-test` runs hidden against a separate temporary QA
profile, generates two models and exports them, then exits with a JSON report
under the temporary `guitar-finish-studio-desktop-qa` folder.

For the downloadable package, extract the ZIP and open `Guitar-Finish-Studio-Offline.html` in a WebGL-capable desktop browser. It embeds the code and samples: no server, Node, Python, account or internet required. This is a browser application, not a native executable. Browser storage differs between file paths and hosted sites; download basket ZIPs before moving or upgrading it.

For hosted use, serve `index.html` and its neighboring files over HTTP/HTTPS. Directly opening that multi-file entry point is not supported because photo loading uses fetch.

Start in **3D builder**: choose a blueprint, adjust finish, rotate the large model and download its GLB/LOD ZIP. **Collection & basket** has batch generation, keep/pass and basket downloads. **Photo editor · 2D** has source imports, masking and PNG export. Workspaces preserve your controls; switching does not clear the basket.

## Upload to itch.io

Upload `dist-itch/guitar-finish-studio.zip` as an HTML project and mark it playable in browser. `index.html` is at the ZIP root; all runtime assets use relative paths and no CDN. Choose **Click to launch in fullscreen**, or a large embedded viewport with scrollbars enabled. Test downloads and browser-storage warnings in an unpublished itch preview before publishing. Mobile layout is responsive, but do not advertise mobile support until physical-device WebGL/export testing is complete.

You can also offer the ZIP as a downloadable tool; tell users to open its Offline HTML file. The package does not install or depend on the guitar-tutor app. No upload or publication is performed by the packaging script. Requirements: https://itch.io/docs/creators/html5

Verification: desktop and 390px workspace switching/generation/keep checked; single-file photo switching and GLB export checked with network disabled after loading. Direct `file:` startup could not be automated because the test browser blocks that protocol. Test double-click startup and an unpublished itch preview before public release. Storage and download behavior can differ in embedded/private browsers.

Built-in photo samples and illustrated demos are included. Users are responsible for having permission to modify and redistribute imported artwork.

### Rule-based batches

The Batch Lab creates 2–36 deterministic variations using color-harmony, finish, pattern, minimum-separation, quantity, and seed rules. Batch export produces a single ZIP containing transparent PNGs and a `manifest.json` with the exact rules and recipes required to reproduce the collection.

### Swipe review and suggestions

Generate a batch, then review the larger card below the gallery. Swipe right to keep
or left to pass. Buttons and left/right arrow keys on the focused card provide the
same controls. Undo restores the last decision. Small drags and vertical scrolling
do not count as decisions; reduced-motion preferences suppress card movement.

Keeps go into a browsable basket with six thumbnails per page and individual remove
buttons. Each new keep captures the approved PNG in IndexedDB, including imported
photoreal guitars. Changing the guitar or mask does not change those saved images.
Older recipe-only keeps use the current artwork and are labelled accordingly.
The recipe backup does not contain artwork; download the basket ZIP to back up images.
Browser data can be cleared or evicted, so keep your downloaded ZIPs somewhere safe.
If storage is blocked/full, review works for the session and displays a warning.
There is no 1,000-decision stop: every keep is retained, while only the most recent
1,000 passes are retained for learning. Real limits are browser storage and memory.

“More designs / similar finishes” generates candidates around recent approved colors using
the current batch rules, then ranks them with five distance-weighted nearby keep/pass
examples. Color, finish, pattern and texture settings influence ranking; a few less
familiar candidates remain for exploration. This is a lightweight local preference
recommender, not an image-quality model. It cannot identify malformed guitars or
judge realism. Each request explores a fresh seed, including when everything was
passed. Request more whenever you want, or stop and download at any time.

“Download basket ZIP” exports only the current basket, with PNGs together in the
`designs/` folder. Each exact recipe
is in the manifest; it does not require an account, model download or network access.

### Actual static 3D assets (GLB)

The rotatable **Actual 3D asset** view shows the mesh that the GLB exporter uses.
It updates after finish/construction changes. Drag to orbit and scroll to zoom.
The upper photo-finishing canvas remains a separate 2D workflow, not a promise
that an imported photo can be reconstructed in 3D.

**Download game asset ZIP** includes:

- `guitar_LOD0.glb`, `guitar_LOD1.glb`, `guitar_LOD2.glb`: decreasing detail levels.
- Embedded base-color, metallic/roughness and normal textures, with explicit
  tangent data and surface normals. No texture files go missing on import.
- `collision.glb`: three coarse box proxies, kept separate from visible geometry.
- `asset.json`: metre units, Y-up/+Z-front convention, recipe, construction and counts.
- `IMPORT.txt`: engine integration notes. Configure LOD switching and collision
  in the receiving engine; glTF does not standardize these assignments.

Meshes have no armature, skins, animation clips, or morph targets. The acoustic
soundboard has a real opening and a hollow body with sides and back, not a dark
disc. Strings, tuning hardware and frets are named parts; frets follow the scale
length and have a supporting fretboard. Both handedness options are supported.

**Review and keep actual 3D assets** is on by default. It changes the review card
to an actual 3D-rendered thumbnail; keeping saves its immutable LOD0 GLB alongside
the image. Basket ZIPs place these in `models/` and `designs/`. Earlier image-only
keeps remain image-only and are labelled. Batch ZIPs also contain LOD0 GLBs when
3D review mode is enabled. The dedicated game-asset export includes all LODs.

This is usable procedural game geometry, not a scanned or hand-sculpted photoreal
instrument. Photo imports do not supply unseen back/side geometry or physically
correct material measurements. Review appearance and performance in the target
engine before shipping; no target-engine project is modified automatically.

Development: run `npm ci`, `npm run build`, and `npm test` in this tool directory.
After extracting an exported ZIP, run `npm run validate -- path/to/extracted/asset`.
The pinned MIT-licensed Three.js runtime is bundled locally; there is no CDN,
account, or paid runtime dependency. `THREE-LICENSE.txt` is included in packages.
The validator is Khronos's official glTF validator (development only).

References: https://threejs.org/docs/pages/GLTFExporter.html and
https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html

### Legacy OBJ mesh export

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

### Varied 3D collections

New collections mix six optional design families: flame/traditional, quilt/broad,
burl/slim waist, ribbon/offset, ripple/compact and spalted/sculpted. These change
actual body proportions, figured PBR pixels, raised perimeter binding, fret inlays,
and selected pickguards/rosettes; detailed electric models also have pickup poles.
They are variations of the five base profiles, not six newly engineered instruments.
Choose a family under **Actual 3D asset**, or disable **Mix design families** to
keep one family. Gloss/matte exposes the figure; carbon/metal retains its own texture.
Texture strength and pattern scale also vary within mixed collections.

Recipes preserve the optional `collectionStyle` (0–5). Missing means classic,
so saved recipes do not silently acquire new geometry. Kept thumbnails and GLBs
are immutable snapshots; new generation never replaces an existing basket asset.
The local preference ranker includes family alongside colors/finishes/patterns.
The 2D photo editor does not reconstruct these changes. Procedural figure is not
scanned wood or a claim of photorealism. Engine import and artistic review remain
necessary. Tests compare actual geometry and color/normal/roughness pixels at
fixed colors, check deterministic reconstruction, and exercise all 30 combinations.

Material channel conventions follow the [Three.js MeshStandardMaterial documentation](https://threejs.org/docs/pages/MeshStandardMaterial.html): sRGB color, linear normal/roughness/metalness data, roughness in green and metalness in blue.

- Preview: disables mask painting.
- Protect: removes areas from the paint mask.
- Paint: restores areas to the paint mask.
- Ctrl/Cmd+Z: undo the latest mask stroke.
- Recipes store colors, finishes, pattern, scale, intensity, and seed. They intentionally exclude source artwork and masks.

## Browser support

The studio uses Canvas 2D, `createImageBitmap`, pointer events, and `canvas.toBlob`. Current Chrome, Edge, Firefox, and Safari are recommended.

## Photoreal starting points and finish limits

The packaged `sources/` folder includes the project's existing photoreal acoustic
and electric guitar artwork. Photoreal acoustic is the default; illustrated demos
remain available and are explicitly labelled. Serve the tool over localhost or
itch.io so its bundled images can load. Choose your own PNG for other shapes.

These are 2D image finishes, not PBR materials: they preserve baked source lighting
and cannot change reflections with camera angle. Brushed metal uses fine grain,
carbon uses alternating fibre bundles, and chosen colors retain source shading.
Hardware masks are fitted to the bundled artwork; inspect imports and use Protect
to correct any areas that need a more exact mask before approving a design.
