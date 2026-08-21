# Contributing to StandardTune

Thanks for your interest! StandardTune is a free, open source guitar tuner and learning companion built with Expo / React Native. Contributions of all sizes are welcome — bug reports, fixes, lesson content, translations, and new features.

## Getting started

Prerequisites: Node 20+, JDK 17, and the Android SDK.

```sh
git clone https://github.com/unexpear/guitar-tutor.git
cd guitar-tutor
npm install
npx expo run:android
```

> The tuner uses a native Turbo Module ([react-native-tuner-engine](https://www.npmjs.com/package/react-native-tuner-engine)), so the app requires a **development build** — it will not run in Expo Go.

## Project layout

```
app/              expo-router screens (tabs + settings modal)
components/       shared UI components
features/
  audio/          guitar sample playback (expo-audio)
  lessons/        lesson content data
  store/          zustand stores (persisted via AsyncStorage)
  tuner/          tuner hook, tuning presets, headstock SVG
assets/audio/     generated reference samples + metronome clicks
scripts/          asset generators
```

## Guidelines

- **TypeScript must pass**: run `npx tsc --noEmit` before opening a PR. CI builds the APK on every push and PR.
- **Dependencies**: use `npx expo install <pkg>` so versions stay aligned with the Expo SDK; `npx expo-doctor` should keep passing.
- **Audio assets** are generated, not hand-edited — change `scripts/generate-samples.js` and regenerate rather than committing edited WAVs.
- **Chord/tuning data**: string arrays are ordered low E → high e (index 0 = 6th string, `-1` = muted, `0` = open). Note names use sharps (`D#2`, not `Eb2`).
- Keep the app free of ads, tracking, and network calls — that's the point of the project.

## Reporting bugs

Open an issue with your device model, Android version, and steps to reproduce. For tuner issues, include the string/tuning you were using and what the display showed vs. what you expected.

## Releases

Maintainers cut releases by tagging `v*`, which triggers a signed build and GitHub Release via CI (see [docs/KEYSTORE-CI.md](docs/KEYSTORE-CI.md)).
