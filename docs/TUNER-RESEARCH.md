# Multi-instrument tuner research

Last reviewed: 2026-09-02

## What the installed engine already does

`react-native-tuner-engine` 1.1.3 runs a native pipeline of high-pass filtering,
YIN, probabilistic YIN and cepstral detection, detector agreement, SNR-weighted
confidence, median filtering, EMA smoothing, onset reset and note-change
hysteresis. The cepstral detector is specifically useful when a string's
fundamental is weaker than its overtones.

The app should not attempt to replace that DSP in JavaScript. Its useful role is
to reject unstable output, match readings to the player's selected target, and
correct only unambiguous target-selected octave/harmonic errors.

Primary references:

- Engine source and API: https://github.com/denizyesilirmak/react-native-tuner-engine
- YIN paper: http://audition.ens.fr/adc/pdf/2002_JASA_YIN.pdf
- pYIN paper: https://webspace.eecs.qmul.ac.uk/s.e.dixon/pub/2014/MauchDixon-PYIN-ICASSP2014.pdf
- Apple measurement audio mode: https://developer.apple.com/documentation/avfaudio/avaudiosession/mode-swift.struct/measurement
- Android raw-input guidance: https://developer.android.com/media/platform/mediarecorder

The engine uses Apple's measurement mode, which minimizes system signal
processing. Its Android Oboe source does not currently request an explicit input
preset. Android documents `UNPROCESSED` as preferred for raw input when the
device supports it, with `VOICE_RECOGNITION` as a fallback without AGC/noise
suppression. That change belongs upstream in the native dependency and requires
device testing; it is not safe to emulate in app JavaScript.

## Configuration issue found

The dependency's React hook calls `configure(options)` and then
`setInstrument(instrument)`. The latter replaces the configured frequency range
with its native preset. For guitar, that means 75–1320 Hz, which excludes C2
(65.41 Hz) and narrowly excludes D2 (73.42 Hz), even if the app requested a
lower floor.

StandardTune therefore uses explicit frequency/filter/frame profiles without
passing the native `instrument` field. Native string matching is not lost in
practice because StandardTune performs target matching itself.

## Supported target conventions

The production tuner catalog now includes:

- Six-string acoustic, electric and classical guitar
- Baritone guitar in B standard
- Seven-string guitar in B standard
- Eight-string guitar in F-sharp standard
- Twelve-string guitar as six declared pairs
- Four-string bass: standard, Drop D, half-step down and D standard
- Five-string bass: B–E–A–D–G
- Six-string bass: B–E–A–D–G–C
- Ukulele: re-entrant high-G, linear low-G and baritone D–G–B–E
- Chromatic mode
- Experimental device profiles for mandolin, five-string banjo, violin, viola
  and cello. Their standard targets follow manufacturer guidance, but the
  physical-device gate below still applies before removing the label.

Manufacturer references:

- Fender guitar and bass comparison, including baritone and 12-string courses:
  https://www.fender.com/articles/instruments/bass-vs-guitar
- Yamaha four/five/six-string bass layouts:
  https://usa.yamaha.com/files/download/other_assets/1/320941/B1DE.pdf
- Yamaha alternate bass tunings:
  https://hub.yamaha.com/guitars/bass/alternate-bass-tunings/
- Kala ukulele tunings and re-entrant behavior:
  https://kalabrand.com/blogs/home/ukulele-tuning-decoded
- Ibanez's supported tuner categories, used as a real-world product comparison:
  https://www.ibanez.com/world/special/TunerApp/
- Yamaha violin/viola/cello tuning reference:
  https://usa.yamaha.com/files/download/other_assets/0/333430/yt240_en.pdf
- Martin mandolin string/course reference:
  https://www.martinguitar.com/strings/m400-mandolin-strings-monel.html
- Deering five-string banjo tuning reference:
  https://www.deeringbanjos.com/pages/how-to-tune-a-banjo

## Noise and overtone policy

1. The native RMS gate and SNR-weighted confidence remain the first line of
   defense.
2. Readings below 0.75 confidence are not presented as a pitch.
3. A JavaScript frequency window is rejected when its peak-to-peak movement is
   over 24 cents. This prevents a wandering fan, voice or noise estimate from
   flashing as a confident tuning instruction.
4. No-pitch frames use RMS to distinguish a very quiet input from high ambient
   sound and show an actionable message.
5. Harmonic correction is only enabled after the user selects a particular
   string. Automatic mode cannot safely decide whether E3 is the second
   harmonic of E2 or a real E3 target. Selected mode may correct ×2, ×3 and ×4
   overtones and a half-frequency period-doubling error when the corrected
   value is within 45 cents of the selected target.
6. Corrections are disclosed in the UI rather than silently hidden.
7. The native median-5 filter is followed by a moderate 0.32 EMA and
   three-frame note hysteresis. The app uses only a three-sample bridge median,
   avoiding the latency of stacking a second five-frame filter.
8. A valid pitch survives a no-pitch gap for 450 ms. This prevents one or two
   dropped frames in a decaying sustain from flashing the display blank; longer
   silence or rejected input still clears the reading.
9. Room profiles move both the RMS gate and confidence floor together: Quiet
   uses -60 dBFS / 0.68, Normal -55 / 0.75, and Noisy -48 / 0.82. The low gate
   is a deliberate user choice rather than an automatic gate that might learn
   a sustained instrument note as background noise.

## Physical-device release gate

Synthetic and unit tests cannot characterize phone microphones, cases, rooms,
amplifiers or device DSP. Before removing the “experimental low range” label
from bass or eight-string guitar, test at least:

- A budget and a current midrange Android phone
- Built-in mic with the instrument unplugged and through a quiet amplifier
- Quiet room, speech in the room and steady fan/HVAC noise
- Repeated attacks and ten-second sustains
- E1, D1 and B0, recording first-lock time, loss rate and octave-error rate
- Selected-string and automatic modes separately
- Device rotation/background/return and incoming audio interruption

Use a development-only native harness or captured engine telemetry when raw E1
results are needed for this gate. Do not ship that diagnostic surface as an
Expo Router route in production.

## Calibration and completion window

ISO 16 specifies A4 = 440 Hz, so 440 remains the default. Professional tuners
commonly allow calibration for ensembles and older recordings: the BOSS TU-3
uses 436–445 Hz in 1 Hz steps, while the TU-03 exposes 430–450 Hz. StandardTune
uses the latter range and applies the selected value to both native note
detection and target-frequency calculation, avoiding a detector/target mismatch.

The engine's measurement accuracy and the UI's completion window are separate
concepts. StandardTune does not claim that a wider green window makes detection
more accurate. The user can choose ±1 through ±5 cents; ±3 is the practical
default, while red still begins at ten cents.

Bundled reference samples were generated at A4=440. When calibration changes,
reference-note and chord players use Expo Audio playback-rate control with pitch
correction disabled, shifting the samples by the same `selected A4 / 440` ratio.
This keeps listening references consistent with the detector and target maths.

References:

- ISO 16: https://www.iso.org/standard/3601.html
- BOSS TU-3 specifications: https://www.boss.info/global/products/TU-3/
- BOSS TU-03 specifications: https://in.boss.info/products/tu-03/
- Expo Audio playback-rate API: https://docs.expo.dev/versions/latest/sdk/audio/
