# Next release preparation

## Play upload boundary (2026-09-28)

**Do not run `npm run release` from current `main`.**

Last Play closed-testing tag: **`v1.3.0-12` (`516a7db`)**. That is the last
intended upload. `app.json` still reads 1.3.0 / versionCode 12; do not bump
and push a new tag until you mean a new Play candidate.

| Commit | What it is | Play |
| --- | --- | --- |
| `516a7db` (`v1.3.0-12`) | Last tagged closed-testing release | Yes, that tag only |
| `87eb530` | UI normalization + instrument-specific learning paths | Only as a **new** versionCode after physical device checks |
| `d1fb779` | Expo-web Reticle harness | **No.** Agent/web verification only. Not a tuner, 3D, or microphone test |

Reticle, `react-native-web`, and Expo web scripts are not product features.
They must not appear in Play listing copy, screenshots, or `whatsnew`.
Production Android still skips the Reticle Babel plugin and uses a no-op
native `connectReticle`. Do not mix the web harness into a Play upload
unless that is the explicit intent of the next tag.

Classical and Cotton Candy stay in the collection as **preview-only** bodies.
They have not passed physical memory, WebView, GPU, or look acceptance.
Fastlane `full_description.txt` and `distribution/whatsnew/whatsnew-en-US`
must not name them. Phone checks still required before any listing that
sells those models: load each body, switch tabs, background/foreground,
watch RAM and 3D fallback.

Release notes must match the tag you actually upload, not every commit on
`main`.

---

## Historical: September 6, 2026 testing build

Owner confirmed testing through releases, not USB, on September 7. That
session targeted 1.3.0 / Android code 11 and is **not** the current Play
head. Device acceptance after install was never a claim of completed
validation. The later tag `v1.3.0-12` superseded that plan.

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

The 19-09 UI worktree is on `main` as `87eb530`; that still does not make
current `main` a Play candidate.
