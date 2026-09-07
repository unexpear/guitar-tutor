# Imported guitar audit — 2026-09-06

User selection: **Add Classical and Cotton Candy; drop Explorer.** Classical
and Cotton Candy passed neutral-shaded 3D shape/detail review; materials and
phone performance are not accepted yet. Explorer and Parlor are both rejected:
do not integrate or reintroduce either without a new user request. Their source
files remain preserved as historical downloads, not approved assets.

Sources remain untouched in `output/imported-guitars/`. No embedded scripts
were enabled. Blender 4.3.2 read all four files with `--disable-autoexec` and
`open_mainfile(use_scripts=False)`. Nothing here has shipped in the phone app.

| Source | Findings | Disposition |
| --- | --- | --- |
| Classical guitar | Source page #31078 lists CC0, author Centurion_1705541. 65 objects, 74,494 base mesh triangles across the scene; modifiers add substantially more. Packed images include environment/reference imagery, not all needed for guitar. Actual source render succeeds. | Promising detailed base; isolate instrument, check visible branding/label, bake procedural materials and reduce geometry. Do not distribute its whole environment. |
| Blues guitar / Parlor | Included #88358 license says CC0 and describes a generic parlor design. Main body 14,829 base triangles, six curve strings; packed color/normal/metal/roughness maps. | REJECTED by user: too flat. Do not integrate in app or generator. Original and staged files retained only as archived work. |
| Cotton Candy | Included #91129 license says CC0; 204 objects, 262,702 base mesh triangles, 29 materials. Packed assets include matcaps/logos and music. Source render in current Cycles is mostly black. | Repair legacy materials and separate visible guitar from electronics/environment. MP3 not added to song library; asset download alone is not music clearance. |
| Gibson explorer re-issue | Included #93727 license also explicitly marks fan art and prohibits commercial use. 63 objects, 55,936 base mesh triangles; two missing image references. | DROPPED by user. Excluded from viewer and approved-source manifest. Original files retained only as historical downloads. |

Base counts are not final render/export triangle counts and include scene props.
Sources: https://blendswap.com/blend/31078 and the three included LICENSE.html
files. CC0 caveats: https://creativecommons.org/publicdomain/zero/1.0/.

## Parlor staged conversion

**REJECTED — user requested dropping this model because it looks too flat.**
The notes below record historical conversion checks, not acceptance. Do not
resume polishing or integrating Parlor without a new user request.

Reproducible tool: `tools/guitar-finish-studio/prepare-parlor.py`.
Output: `output/imported-guitars/prepared/parlor.glb` (1,853,444 bytes).
20,903 triangles, seven meshes; String_1…String_6 retain low E through high e.
Uses source UVs and 1024px packed PBR images, upright orientation and ground origin.
One subdivision level followed by body-only decimation; reduced curve resolution.
No source camera, floor, pick, animations or skins exported.
Source extra height-bump layer is omitted; its existing tangent normal is kept.
One zero UV tangent receives a documented normal-orthogonal fallback. The exporter
warns that packed metal/rough images share a sampler; audited mapping is identical.
Khronos validation: zero errors/warnings, static, no external resources.

Review: `output/playwright/parlor-review.html` and `imported-parlor.png`.
Real GLB loaded in Three.js, string selection tested. First browser load lost its
WebGL context; reload succeeded. Physical Android device performance, UV detail
after decimation, full material parity, label/branding checks and finished tuner
integration are NOT yet accepted. Do not call this photorealistic or released.

## Source SHA-256

### Six-string target preparation — September 7

Both current material GLBs expose `String_1` through `String_6` in low-E to
high-e order (the phone renderer's index convention, not conventional string
numbers). Viewer buttons explicitly label E2/string 6 through E4/string 1.
Classical source names map as 4,5,6,3,2,1, based on the front-facing bass-to-treble
positions. Cotton's string mesh contains exactly six connected components;
separation preserves UVs and triangle count. Components are ordered by their
world-X intersection with the audited neck plane at world Z=0.8, rather than
assuming evenly spaced vertices along a long edge.

Cotton now renders 46 mesh parts (five more to make its six strings independent),
with 91,884 triangles unchanged. Classical remains 73,570 triangles / 51 parts.
Both material exports pass Khronos validation with zero errors/warnings.
All six selection buttons and Clear passed browser checks on each model.
Screenshots: `cotton-string-low-e.png`, `classical-string-high-e.png` under
`output/playwright/`. Gold highlights remain too faint at full-guitar size,
particularly on the light maple neck; readability/glow and phone integration
are not accepted. The preview currently changes materials on selection, without
continuous animation. No release or phone model registration occurred.

### Cotton coating and hardware follow-up — September 7

The latest Cotton export adds optional `KHR_materials_iridescence` to the body
only: factor 0.85, IOR 1.3, uniform 380 nm film. This is a new thin-film
approximation, not recovered matcap lighting or measured automotive paint.
Unsupported viewers retain cyan lacquer. No new images or geometry are needed.
Reference: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence.
Browser diagnostics confirm the extension reloads into the body material;
other materials have zero iridescence. The visible effect is subtle in the
current environment and still requires aesthetic tuning.

Static single-material chrome objects are consolidated, preserving world
transforms. Export guards assert unchanged triangle count and overall bounds.
Rendered parts fell from 157 to **41**, with 91,884 triangles unchanged.
Actual browser render: `output/playwright/cotton-consolidated.png`.
Khronos validation remains zero errors/warnings. This reduces potential draw
calls; it is not a physical-device performance measurement. No phone integration
or release took place in this pass.

### Cotton Candy material conversion — September 7

`tools/guitar-finish-studio/prepare-cotton.py` reconstructs glTF-compatible
materials from the legacy source. Packed maple, inlay, knob-label and string
color images are reused; matcaps are not passed off as lighting-independent PBR.
Chrome/metal and coated cyan paint use explicit new shader settings, not a
claim of recovered original optical parameters. The original source is not saved.
Logo objects and selected internal wire/electronics objects are excluded from
the optimized selection; body, neck, strings and pickguard are protected from
decimation. Existing four phone models are unchanged; Explorer/Parlor stay excluded.

Output: `output/imported-guitars/material-review/cotton.glb`, 3,027,020 bytes,
91,884 triangles, 149 source meshes / 157 rendered parts after material splits.
Khronos validation: zero errors/warnings, static and self-contained.
Actual browser screenshot: `output/playwright/cotton-material.png`.
Material-view mode now supports both Classical and Cotton Candy and the
geometry comparison link correctly exits material mode.

Remaining: cyan lacquer does not reproduce the legacy iridescent effect;
normal/occlusion images are not yet transferred, hidden-component pruning and
draw-call reduction need more inspection, and string targeting / Android
performance / source-render parity are not accepted. Not integrated or released.

### Classical material conversion — September 7

New reproducible tool: `tools/guitar-finish-studio/bake-classical.py`.
It reuses the approved hash/geometry selection, leaves the source untouched,
excludes unused scene objects from baking, pins source UV references and packs
a separate BakeUV atlas. Color, roughness, metallic and tangent normal maps are
baked from the source shader networks; new glTF-compatible materials use them.
The local output is `output/imported-guitars/material-review/classical.glb`.
At 1024px it retains 73,570 triangles; material splits produce 51 rendered meshes.
It is static and self-contained. Khronos validation passes with zero errors and
zero warnings after one undefined tangent receives a documented orthogonal
fallback via `repair-zero-tangents.py`; all valid tangents remain unchanged.

Actual browser screenshot: `output/playwright/classical-baked-final.png`.
Viewer URL: `output/playwright/guitar-candidates.html?materials=baked#classical`.
The original neutral geometry remains available and Cotton Candy still uses
neutral materials. No imported models have been added to the phone yet.

Not accepted as finished: close-up edge/texture artifacts, limited atlas detail,
unbaked coat-normal detail and linked specular/coat inputs, six-string target
mapping, phone framing and Android memory/performance. Scalar optical values
are retained where possible, but this is not full source-render parity.

Approved-source manifest: `tools/guitar-finish-studio/approved-imports.json`.
The review exporter checks source hashes and rejects excluded models.
Reduced-detail candidates in `output/imported-guitars/lod-review/` contain
22,941 triangles / 53 meshes (Classical) and 23,583 triangles / 163 meshes
(Cotton Candy), versus 496,464 and 251,848 triangles in the full review exports.
Both pass Khronos validation with zero errors/warnings and are static,
self-contained GLBs. These are **geometry-only candidates**, not finished
phone assets: decimation needs visual acceptance, materials need conversion,
branding/props need cleanup, and string selection/device performance need testing.
The viewer offers an explicit reduced-detail comparison; original geometry
remains the default. Existing phone guitar choices are unchanged.

Browser check: Explorer is absent from navigation and its old URL falls back
to Classical. Both reduced candidates load. Classical's reduced export shows
visible surface/shading artifacts in the front view and is **not accepted**.
Cotton Candy loads but has not passed a detailed geometry/material inspection.
Screenshots: `output/playwright/classical-reduced.png` and
`output/playwright/cotton-reduced.png`. Do not promote either reduced export
to the app based only on successful GLB validation.

### Surface-preserving Classical candidate

`lod-surface-review/classical.glb` is a separate, later experiment; the approved
source and previous candidates are not overwritten. The exporter now preserves
Deck, Deck inside, Vulture, bridge (Stand), frets and nuts during reduction.
The optimized selection excludes the branded Sticker and source floor-stand
components. A 50,000-triangle request correctly refuses to damage protected
surfaces, which alone total 59,744 triangles. With an 80,000 budget the output
is 73,570 triangles / 46 meshes and passes Khronos validation (0 errors/warnings).
The front browser comparison no longer shows the earlier broad body ripples.
This is still neutral geometry, not a textured or device-approved phone asset.
Screenshot `output/playwright/classical-surface-preserved.png` was captured via
a diagnostic network substitution in the viewer, so its approved-source heading
does **not** signify acceptance of this new candidate.

- Classical: BAB35192E2E6D95BB7A73FB25FFC221D91ACF8579695FEA91E7C5130B5C00E5D
- Parlor: 22E6C12394CE038CE96683C7C25A99D6CD035344078A6A5A5641F0A5B1141B37
- Cotton Candy: DDA49C6D941F6F43175C4B8FBAB3C55C607C651F2C4A77A61FCBE68D75ED86F3
- Explorer: 1A350A7A1367628031AF595C12883393F097045BD61B0B490A806CE895FA0F8F
