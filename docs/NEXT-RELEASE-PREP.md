# Next release preparation

## Play upload (2026-09-30)

Closed testing upload requested from current `main`. `npm run release` cuts
**`v1.3.0-13`** (versionCode 13). The previous Play tag remains
`v1.3.0-12` (`516a7db`).

This build includes learning paths, original four-string bass exercises, and
tuner mapping on the existing engine. It does **not** include a live
instrument or microphone check. Reticle is not a Play feature: production
Android skips that plugin. Do not name preview bodies in `whatsnew` or the
store listing.

| Commit | What it is | Play |
| --- | --- | --- |
| `516a7db` (`v1.3.0-12`) | Previous closed-testing tag | Already uploaded |
| `v1.3.0-13` | This closed test: paths, bass exercises, tuner mapping | Yes, this tag |

Owner has **no instrument** for a live tuner pass. Do not treat unit tests or Expo web as microphone acceptance. Unprocessed Android input, looping a drone under the mic, and sweetened tunings stay out of scope.

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

- Classical / Cotton Candy: still **preview-only**. Phone 3D (memory, WebView,
  tab switch, fallback) does not need a guitar, but it does need an Android
  device. No physical acceptance has been recorded. Listing/`whatsnew` must
  not name them.
- Explorer and Parlor remain excluded. Existing four catalog bodies stay.
- Live tuner/mic/Follow Me with a real instrument is **deferred** (owner has
  none). Do not remove experimental low-range labels from that.
- Prepare accurate release notes only for a tag you actually upload.
  Current `main` is not a Play candidate.

## Next without an instrument

- Keep the Play freeze until you deliberately bump versionCode.
- Do not add UNPROCESSED mic, looping drone-under-tuner, or sweetened tunings.
- Later product (not this commit): rights-cleared repertoire per path, and
  more bass-only material. Do not mark guitar charts as bass arrangements.

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
