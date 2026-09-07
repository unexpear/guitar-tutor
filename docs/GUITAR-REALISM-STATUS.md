# Guitar realism work — 2026-09-06

Acceptance target: photorealistic static guitars in the generator, portable GLB
exports, and the phone tuner. **Not achieved yet.** Tests validate correctness,
not visual realism. Current work is uncommitted and unreleased.

Implemented in the shared mesh builder:
- Single-cut carved perimeter with an unchanged central mounting plateau.
- Rounded neck backs, 12-inch visual-default fingerboards and curved fret crowns.
- Shaped knobs, attached tuner shafts/housings, thicker pickup covers and slots.
- Smooth pickguards and separate acoustic exterior/interior back materials.
- Separate captured rosewood for fretboards/bridges; source provenance and bake
  scripts are in tools/guitar-finish-studio/CAPTURED-MATERIALS.md.
- Captured CC0 studio HDR environment, packed offline at 512×256 without tone
  mapping the radiance. Shadow maps regenerate only when models change.

Checks: 23 geometry/material/source tests; TypeScript; 14 material GLB exports
validated with no errors/warnings. Browser checks use the actual mobile HTML.
Tested Legendary electric: 13,210 triangles, 129 meshes, 15 renderer textures;
205 initial draw calls, 135 on subsequent string highlight changes. These are
desktop-browser measurements, not physical-phone performance certification.
Offline mobile HTML is approximately 2 MB.

Carbon pass: replaced the wave/checker approximation with two-over/two-under
tows, separate relief and roughness, and a direction map for anisotropic
reflections under the resin clearcoat. Reference structure:
https://www.easycomposites.co.uk/200g-22-twill-3k-carbon-fibre-cloth
No reference photographs are redistributed. Carbon alone now uses 512px maps
with 64 tows across (previously 32 at 256px); other finishes remain 256px.
No geometry is added. Carbon enables one extra directional texture/shader
feature. Its five RGBA maps occupy approximately 6.67 MiB including mipmaps
instead of 1.67 MiB at 256px, excluding renderer/CPU overhead. Physical-phone
performance remains unverified. Current phone reward recipes do not select it.
Export/reload checks include carbon anisotropy. Actual two-angle render:
output/playwright/refined-coatings.png. This is not a scanned laminate or a
claim of photorealism.

Carve correction: normals now respect the clamped height deformation outside
the body slab. A finite-difference tangent-plane regression covers front bevel,
interior and back. The height profile now uses smootherstep for zero first and
second derivatives at the rim/plateau (Three.js MathUtils documentation:
https://threejs.org/docs/pages/MathUtils.html). Outline, mounting plateau and
triangle counts are unchanged. Horn highlights still show contour artifacts;
the nearest-outline distance field is not a fully smooth sculpted surface.

Remaining: visible procedural construction, simplistic hardware/joins, limited
wood species, no measured coating calibration, and physical-device validation.
Review images are under output/playwright/; they are not proof of acceptance.

Candidate for a higher-detail base (not imported, not verified mobile-ready):
https://blendswap.com/blend/31078 — Classical guitar by Centurion_1705541, listed
CC0, Blender 3.0x/Cycles, 185 MB. Public preview inspected; actual download at
https://blendswap.com/blend/31078/download requires sign-in. A user-provided
download would allow mesh/material inspection, optimization and compatibility
evaluation. Do not bypass authentication or claim the candidate is integrated.
