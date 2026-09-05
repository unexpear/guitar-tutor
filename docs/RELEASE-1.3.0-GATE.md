# Planned 1.3.0 / Android code 10 — publication on hold

The user explicitly requested no release until they say to proceed. Do not tag,
push a release, or upload this candidate. Current app/package versions remain
1.2.0 and Android code 9; the eventual release must synchronize app.json,
package.json and the root versions in package-lock.json.

## Reviewed candidate

- 26 generic progression/technique exercises and 15 song chord references.
- Exact target beat durations in timed practice, Follow Me feedback, adjustable
  tuner green/red zones, and large-text layout fixes.
- Follow Me scoring corrected: ungraded timing no longer caps a perfect run at 60%.
- Hit processing no longer advances targets or changes other state inside a
  state updater, which React may replay. This fixes a concrete unsafe path but
  does not prove the separate live-tuner update-depth report resolved.
- Release/store text no longer advertises invented songs; roadmap lists 10 games.
- Songs store screenshot replaced with the existing real Android capture from
  output/beginner-flow/songs.png, showing the 41-item catalogue. No mockup or
  image editing was used. This is an earlier capture of the unchanged Songs page,
  not proof that the latest candidate passed device testing.
- Guitar Finish Studio adds local swipe review, recipe persistence, kept exports,
  backup/restore, and preference-ranked suggestions. It does not assess image
  quality or guitar anatomy, and exports use the current source image and mask.

## Verification and remaining device gate

On 2026-09-05, 300 tests and TypeScript passed. Android debug compilation passed.
The standalone studio was checked in Edge at a 393px viewport: keep/pass, mouse
swipe, keyboard decisions, undo, suggestions, reload persistence, imported
photoreal artwork and kept-only ZIP export. The ZIP manifest matched its PNG count.

The new Android debug launch still failed to load its JavaScript from Metro.
A temporary application debug-flag override did not resolve it and was reverted.
Compilation is not device verification. Before release:

1. Run the exact release candidate on a physical phone, with normal and enlarged
   text, and check tuner, Settings values, game badges and the model picker.
2. Resolve/recheck the prior live-microphone maximum-update-depth report; verify
   tuning stability, quiet-room false positives, overtones and string switching.
3. Verify Follow Me and Play in Time with real single notes and chords, guide audio
   separated from mic scoring, green feedback and timing/score completion.
4. Check low bass E1/B0 on real hardware before claiming those ranges validated.
5. Refresh remaining store captures as needed and confirm the intended Play track.
6. Only after the user resumes release, synchronize version 1.3.0 / code 10 and
   use the release workflow. The current helper increments the code automatically.
