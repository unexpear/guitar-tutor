# Imported guitar assets

These are static, self-contained 3D meshes, not animated or rigged assets.
`models.json` contains base64 GLB data for the offline native WebView bridge.
The two PNGs are transparent renders of those same meshes, used as previews.

- Classical: Centurion_1705541, https://blendswap.com/blend/31078,
  CC0-1.0. Source SHA-256:
  `BAB35192E2E6D95BB7A73FB25FFC221D91ACF8579695FEA91E7C5130B5C00E5D`.
- Cotton Candy: EvanG3D, BlendSwap #91129, CC0-1.0 per the included
  `LICENSE.html`. Source SHA-256:
  `DDA49C6D941F6F43175C4B8FBAB3C55C607C651F2C4A77A61FCBE68D75ED86F3`.

License: https://creativecommons.org/publicdomain/zero/1.0/.
Original downloads and license evidence are archived under
`output/imported-guitars/`; see `docs/IMPORTED-GUITAR-AUDIT.md`.
Source music, logos, reference environments and rejected models are not included.

Classical materials are baked from the source; Cotton materials are reconstructed
using selected packed maps. Geometry is optimized and each model exposes six
String_1 through String_6 mesh targets. Their finishes are fixed: player skins and
random finish rewards apply only to the original four customizable models.

Build with the audited Blender export scripts, then run
`node tools/guitar-finish-studio/package-imports.mjs` from the repository root.
Mobile runtime and visual acceptance remain gated on physical Android testing.
