# Chord reference audio audit — 2026-09-05

## Confirmed code failure

`soundController.ts` assigned `player.playbackRate` before calling `play()`.
Installed Expo Audio 57.0.4's Android AudioModule defines that property with a
getter only. Its `setPlaybackRate(rate)` method is the supported native operation.
The outer catch hid the failure from the Chords UI. Use the method, keeping pitch
correction disabled so A4 calibration still retunes the reference notes.

The audio test double now also has a getter-only playbackRate and the native
method. This reproduces the old assignment failure instead of permitting it.
Muted app settings now produce a visible explanation when Hear it is pressed.

Reference: https://docs.expo.dev/versions/v57.0.0/sdk/audio/
Implementation: node_modules/expo-audio/android/src/main/java/expo/modules/audio/AudioModule.kt

## Real, freely reusable recordings

Karoryfer explicitly states that its free sample libraries (except Marie Ork)
are now CC0, including older archives carrying older licence text:
https://shop.karoryfer.com/pages/free-samples

- Emilyguitar: recorded electric guitar, 323 WAVs, 24-bit/44.1 kHz, 98 MB download.
  https://shop.karoryfer.com/pages/free-emilyguitar
- Shinyguitar: recorded archtop guitar with microphone and pickup versions,
  linked from the same official free-samples page.

Bundled an 11-recording Emilyguitar subset (2.9 MB) for chord playback only.
Every catalogue chord maps to a sample at most one semitone away. The original
single-note reference bank is unchanged, including the tuner's precision tones.
Recordings are real performances, not new songs or AI-generated music.

`scripts/import-chord-recordings.mjs` pins the source revision, converts PCM24 to
PCM16 mono, normalizes peaks to 0.65 and fades the three-second excerpts. The
recordings folder includes CC0 text and input/output hashes. No runtime download
or paid dependency is needed. An initial 150–250 ms periodicity check measured
roughly +1.6 to +8.3 cents across these plucks: natural guitar pitch movement, not
precision oscillator tones. Do not substitute them for the tuner's reference bank.
Physical playback/timbre approval remains part of the device gate.

Philharmonia's samples are not equivalent: their terms prohibit redistribution
as samples or a sampler instrument, so do not drop those raw files into this app.
https://philharmonia.co.uk/resources/sound-samples/

## Remaining device gate

### Follow-up app-wide audit fixes

All 79 bundled WAVs existed and contained valid, non-silent PCM16 audio; no
built-in tuning/chord asset references were missing. Custom tuning reference
lookup now normalizes flats and octave-crossing accidentals. A0/A#0 and F6–A6
use precise playback-rate ratios from the nearest bank edge (B0/E6), composed
with the chosen A4 calibration; existing bank notes retain their original rate.

Ear Training/Rhythm Master restore a muted sample volume to 50% when starting,
with an upfront explanation; nonzero volume preferences are preserved. Chord
Quiz excludes listening questions at zero volume as well as when sound is off.
Shared reference playback reports mute/missing/exception failures through a
throttled alert. A muted practice guide stops rather than continuing silently.

Capo guide chords now add capo semitones to the displayed shape's MIDI notes.
Stop Guide releases single notes as well as chord players and queued strums.
Regression tests cover these mappings, calibration, playback notifications,
audibility and reuse after stopping. These changes do not substitute for the
physical playback checks below or establish low-bass speaker audibility.

Automated tests verify the controller and calibrated strum behavior, not physical
speaker output. Check Hear it for C, G, E minor and a sharp/barre chord on the phone;
repeat rapidly, switch from the tuner, and check muted settings and Bluetooth.
The release remains on hold until the user's approval and device gate.
