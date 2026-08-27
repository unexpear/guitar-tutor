# StandardTune

A free and open source guitar tuner and learning companion for Android. No ads, no tracking, no in-app purchases.

## Screenshots

| Tuner | Chords | Anatomy lesson |
|---|---|---|
| ![Tuner](fastlane/metadata/android/en-US/images/phoneScreenshots/01-tuner.png) | ![Chords](fastlane/metadata/android/en-US/images/phoneScreenshots/02-chords.png) | ![Anatomy](fastlane/metadata/android/en-US/images/phoneScreenshots/03-anatomy.png) |

| Metronome | Lessons | Songs |
|---|---|---|
| ![Metronome](fastlane/metadata/android/en-US/images/phoneScreenshots/04-metronome.png) | ![Lessons](fastlane/metadata/android/en-US/images/phoneScreenshots/05-lessons.png) | ![Songs](fastlane/metadata/android/en-US/images/phoneScreenshots/06-songs.png) |

## Features

- **Real-time tuner** powered by [react-native-tuner-engine](https://www.npmjs.com/package/react-native-tuner-engine) — a native C++ pitch-detection pipeline (YIN / PYIN / cepstrum ensemble) running on a dedicated audio thread
- **16 tuning presets** — Standard, Drop D, Drop C, Open G, DADGAD, Half Step Down, and more
- **Single-string tuning** — tap a string to aim at it; green means dead on, amber within nine cents, red past ten
- **Chord library** — 36 chords with finger positions, diagrams that draw barres and slide up the neck, and tap-to-hear playback
- **Metronome** — 40–200 BPM, tap tempo, accented downbeats, 2/4 · 3/4 · 4/4 · 6/8, on a drift-corrected clock shared with the play-along drills
- **Lessons** — 15 structured beginner-to-advanced lessons (14 with full instructional text, plus an interactive guitar-anatomy diagram and quiz)
- **Song library** — 15 songs with the chords each one needs, plus key and capo
- **Play-along practice** — Guitar Hero-style drills that listen to your real guitar: pluck the directed string/fret or strum the directed chord, with an "any tone" beginner mode and a "full chord" mode that requires evidence of multiple chord tones before scoring a hit
- Dark theme throughout

- **Chord Quiz** — name the shape, pick the shape, or name what you hear, with distractors chosen to be the chords people actually mix up
- **Chord Changes** — the one-minute-changes exercise, counted off your actual playing
- **Practice tracking** — time at the instrument, logged per day against a goal, with a streak

Five of the seven cards in the Games tab are not built yet; they are dimmed
and marked "Soon". The two that are built — Chord Quiz and Chord Changes — are
playable now. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Development

Requires Node 20+ and an Android development environment (JDK 17, Android SDK).

```sh
npm install
npx expo run:android
```

Logic that does not need a device — the chord data, the play-along matcher,
the beat clock, the song library — is covered by unit tests:

```sh
npm test
npm run typecheck
```

Shipping a build to the closed testers is one command, which bumps the
Android version code, tags, and lets CI build and upload it:

```sh
npm run release
```

See [docs/PLAY-SUBMISSION.md](docs/PLAY-SUBMISSION.md) for the one-time
service-account setup that the upload step needs.

> **Note:** the tuner uses a native Turbo Module, so the app must be built as a
> development build — it will not work in Expo Go.

Useful scripts:

- `npm start` — Metro dev server
- `node scripts/generate-samples.js` — regenerate the guitar reference samples in `assets/audio/`

## Release builds

CI (`.github/workflows/build-release.yml`) builds an APK on every push to `main` and publishes a GitHub Release on `v*` tags.

Signed builds require four repository secrets: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` — see [docs/KEYSTORE-CI.md](docs/KEYSTORE-CI.md). Without them, CI still produces a debug-signed APK artifact, but no Release is published.

## Privacy

StandardTune collects no data. Microphone audio is processed on-device for pitch detection and never recorded or transmitted — see [PRIVACY.md](PRIVACY.md). Play Store submission notes live in [docs/PLAY-SUBMISSION.md](docs/PLAY-SUBMISSION.md).

## License

[MIT](LICENSE)
