# StandardTune

A free and open source guitar tuner and learning companion for Android. No ads, no tracking, no in-app purchases.

## Features

- **Real-time tuner** powered by [react-native-tuner-engine](https://www.npmjs.com/package/react-native-tuner-engine) — a native C++ pitch-detection pipeline (YIN / PYIN / cepstrum ensemble) running on a dedicated audio thread
- **16 tuning presets** — Standard, Drop D, Drop C, Open G, DADGAD, Half Step Down, and more, with tap-to-play reference notes
- **Chord library** — 29 chords with finger positions, diagrams, and audio playback
- **Metronome** — 40–200 BPM, tap tempo, accented downbeats, 2/4 · 3/4 · 4/4 · 6/8
- **Lessons & games** — structured beginner-to-advanced lessons and practice mini-games
- Dark theme throughout

## Development

Requires Node 20+ and an Android development environment (JDK 17, Android SDK).

```sh
npm install
npx expo run:android
```

> **Note:** the tuner uses a native Turbo Module, so the app must be built as a
> development build — it will not work in Expo Go.

Useful scripts:

- `npm start` — Metro dev server
- `node scripts/generate-samples.js` — regenerate the guitar reference samples in `assets/audio/`

## Release builds

CI (`.github/workflows/build-release.yml`) builds an APK on every push to `main` and publishes a GitHub Release on `v*` tags.

Signed builds require four repository secrets: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` — see [docs/KEYSTORE-CI.md](docs/KEYSTORE-CI.md). Without them, CI still produces a debug-signed APK artifact, but no Release is published.

## License

[MIT](LICENSE)
