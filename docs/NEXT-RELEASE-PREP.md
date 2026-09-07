# Next release preparation — September 6, 2026

Owner has confirmed testing through releases, not USB, on September 7.
Proceed with an owner-testing release via the existing closed-testing workflow:
version 1.3.0 / Android code 11. Device acceptance remains pending after installation,
not a claim of completed validation or a pre-upload blocker for this testing build.

## Checks completed

- App TypeScript check passed.
- All 323 app tests passed, including audio asset mapping and practice regressions.
- All 23 generator geometry/material tests passed.
- Android production JavaScript export passed (not a signed native build).
- Offline mobile 3D scene rebuild matches the existing generated scene byte-for-byte.
  `npm run guitars:mobile:check` now checks freshness without rewriting files;
  install the studio dependencies before using this command.
- Root Node engine requirement now excludes Node 20, consistent with Expo 57's
  documented minimum Node 22.13. CI already uses Node 24; local checks used 24.15.
  Reference: https://docs.expo.dev/versions/v57.0.0/.

## Still required

- Classical: first 1024px material bake now loads and validates (September 7).
  Refine close-up edge/texture artifacts and coating parity, inspect all angles,
  confirm final material acceptance on the phone.
- Cotton Candy: first PBR reconstruction loads and validates (September 7),
  reusing packed wood/inlay/knob/string color images and excluding logo objects.
  Confirm coating parity and geometry/draw-call cost on the phone.
  Both imports are now wired into the phone source as fixed-finish previews;
  they have not shipped or passed physical Android acceptance.
- Explorer and Parlor remain excluded. Existing four phone models and unlocks
  remain intact. See IMPORTED-GUITAR-AUDIT.md for source selection and provenance.
- Test Android WebView startup, background/foreground, tab switching, fallback,
  microphone coexistence and memory on the owner's phone.
- Confirm tuner framing and string visibility with large text and small screens.
- Check daily gift persistence, equipping, reset and existing level unlocks.
- Hear chords and reference notes on-device; exercise Follow Me, backing playback
  and microphone scoring together. Passing file tests is not an audible device test.
- Review the complete dirty worktree and prepare accurate release notes/screenshots
  for the actual included feature set. Do not advertise imported guitars or completed
  photorealism before they are integrated and accepted.

## September 7 integration update

- Post-integration verification: TypeScript, all 326 app tests, all 23 generator
  tests, offline scene freshness and Android production JavaScript export passed.
  Exported Hermes bundle is approximately 17 MB; no signed native build was made.
- Added Classical and Cotton Candy to the selector and offline 3D renderer,
  with actual rendered thumbnail fallbacks. Kept all four existing models,
  forty bundled player skins, and the existing starter/level unlock catalog.
- Imports remain outside the random reward model pool; seeded rewards retain
  their original model mapping. Imported thumbnails do not use guessed SVG
  string coordinates; the live renderer uses the actual six mesh strings.
- Added a screen-space gold halo and reduced-motion-aware soft pulse.
- Embedded texture decoding required `connect-src blob:` in the offline CSP.
  External HTTP connections remain blocked by CSP.
- Browser smoke checks of the bundled mobile HTML passed for both imports at
  360x240; three rapid alternating-load rounds finished on the requested model
  without reported errors. This is not a native bridge or device performance test.
- Classical: 73,570 triangles / 51 meshes; Cotton: 91,884 / 46 meshes.
  Embedded GLB data increases the Android JavaScript bundle substantially.
- ADB reported no attached devices. Native startup, bridge payload size, memory,
  microphone coexistence, lifecycle recovery and audible playback remain gates.
- Follow-up: added a separate 15-second model-render deadline after renderer
  startup. A failed/hung decode now triggers the image fallback; pitch updates
  cannot keep extending the deadline. Stale model acknowledgements are ignored.
  Browser checks received exactly one rendered acknowledgement per imported model
  while selecting all six strings. TypeScript and 326 app tests still pass.
- The local ignored Android project still has version 1.0.0 / code 1 and debug
  signing. Do not distribute it as the current release. CI regenerates Android
  from app.json before applying release signing; no release tag was pushed.
