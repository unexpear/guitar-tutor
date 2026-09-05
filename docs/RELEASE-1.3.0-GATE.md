# 1.3.0 / Android code 10 — owner testing release

On 2026-09-05 the owner explicitly authorized publishing before device validation:
they are the only user and test through releases. The checks below are therefore
post-release owner acceptance checks, not a publication blocker. They have NOT
passed yet. Publish through the existing GitHub APK / Play alpha testing workflow;
this is not evidence of production readiness. The release targets app/package
version 1.3.0 and Android code 10.

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
  backup/restore, preference-ranked suggestions, static 3D mesh/PBR exports and
  standalone Windows packaging. Suggestions do not assess image quality or
  guitar anatomy. Photo exports and procedural 3D exports are distinct workflows.
- Audio playback uses Expo's supported playback-rate method, includes 11 CC0
  recorded guitar samples, and handles mute/missing/playback exceptions visibly.
  Reference lookup supports accidentals and edge-range pitch shifting; capo guide
  audio, playback cleanup, saved-section fallback and progression storage are fixed.
- Chord details offer per-string playback and an arpeggio. About now explains its
  values. Stage is labeled Large display. The six-string acoustic/electric tuner
  shows the selected full guitar and a static highlighted tuning-peg close-up.

## Verification and remaining device gate

On 2026-09-05, the current candidate passed 319 app tests, TypeScript, five studio
mesh tests, Android export (1,982 modules / 189 assets), and source whitespace
checks. The generated Three.js bundle contains upstream shader-string whitespace
and is excluded from the whitespace check; it rebuilt successfully. The audio
audit found all 79 bundled WAVs present and non-silent. These
checks do not establish physical playback or microphone accuracy. ADB currently
lists no connected devices.

Earlier Android debug compilation passed.
The standalone studio was checked in Edge at a 393px viewport: keep/pass, mouse
swipe, keyboard decisions, undo, suggestions, reload persistence, imported
photoreal artwork and kept-only ZIP export. The ZIP manifest matched its PNG count.

The new Android debug launch still failed to load its JavaScript from Metro.
A temporary application debug-flag override did not resolve it and was reverted.
Compilation is not device verification. Owner checks after installing this release:

1. Run the exact release candidate on a physical phone, with normal and enlarged
   text, and check tuner, Settings values, game badges and the model picker.
2. Resolve/recheck the prior live-microphone maximum-update-depth report; verify
   tuning stability, quiet-room false positives, overtones and string switching.
3. Verify Follow Me and Play in Time with real single notes and chords, guide audio
   separated from mic scoring, green feedback and timing/score completion.
4. Check low bass E1/B0 on real hardware before claiming those ranges validated.
5. Refresh remaining store captures as needed and confirm the intended Play track.
6. Report device results against version 1.3.0 / code 10. The release helper
   increments the Android code automatically; package versions are synchronized
   separately. A version tag publishes the GitHub release and submits to the
   configured Play alpha track.
