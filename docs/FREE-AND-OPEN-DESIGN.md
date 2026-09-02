# Free and open design notes

Last reviewed: 2026-09-02

StandardTune is intended to remain a useful tuner and learning companion
without advertising, accounts, subscriptions, tracking, or paid tuning packs.
Microphone processing and progress storage stay on the device. The application
source is MIT licensed; third-party packages retain their own licenses.

## How outside projects are used

Other products are studied for public behavior and broad interaction patterns.
Their source code, writing, artwork, recordings, branding, and proprietary
lesson material are not copied. GPL projects are research references only.

| Reference | License/status | Product lesson taken |
|---|---|---|
| [react-native-tuner-engine](https://github.com/denizyesilirmak/react-native-tuner-engine) | MIT; direct dependency | Native on-device pitch analysis and documented configuration API |
| [Tuner by Michael Moessner](https://f-droid.org/packages/de.moekadu.tuner/) | GPL-3.0-or-later; no code used | Custom instruments, calibration, and advanced controls can remain free |
| [NeuralPitch](https://github.com/derekkinzo/neural-pitch) | MIT OR Apache-2.0; no code used | Persisted A4 reference and restrained live-tuner diagnostics |
| [fgnass/tuner](https://github.com/fgnass/tuner) | MIT; no code used | Offline operation, auto/manual targeting, and stability-first feedback |
| [GuitarTuner](https://github.com/SysAdminDoc/GuitarTuner) | MIT; no code used | Beginner tune-up/down language and physical-device microphone testing |
| [GuitarTuna](https://guitartuna.com/about) | Proprietary product comparison | Fast target selection and beginner-readable feedback; no branded assets or text used |
| [BOSS TU-3](https://www.boss.info/global/products/TU-3/) | Proprietary hardware reference | A4 calibration in 1 Hz steps and a clear completion state |

The dependency lock reports predominantly MIT, Apache, BSD, ISC, and other
permissive licenses. It also contains packages under MPL-2.0, CC-BY-4.0,
Python-2.0, and a dual BSD/GPL choice; those packages are not relicensed by this
project. A release should continue to preserve notices shipped by dependencies
and should repeat the license audit when dependencies change.

## Learning-product references

- [JustinGuitar Beginner Grade 1](https://www.justinguitar.com/classes/beginner-guitar-course-grade-one)
  demonstrates a useful progression: tune and hold the instrument first, then
  introduce a small chord set, chord changes, rhythm, songs, and consolidation.
- [JustinGuitar's learning guidance](https://www.justinguitar.com/faq/how-justinguitar-works)
  emphasizes flexible step-by-step practice and consolidation instead of merely
  racing through lessons.
- [Open Music Academy](https://openmusic.academy/?language=en) shows how music
  learning resources can be published as explicitly licensed open educational
  resources.

These references guide sequencing only. StandardTune's lesson prose, diagrams,
tests, generated reference tones, and exercises are maintained in this
repository. Named commercial songs are chord-reference entries with original
two-pass chord-set exercises. They contain no lyrics, tablature, melody,
recordings, tempo maps, or bar-by-bar transcriptions, and the practice screen
explicitly says it is not the song arrangement. Any future bundled lesson
media or arrangements must record its author and license before release.

## Product rules

1. Core tuning, every built-in tuning, chromatic mode, calibration, and useful
   accuracy controls remain available without payment or sign-in.
2. No ads, behavioral analytics, dark patterns, or artificial daily limits.
3. No network permission is required for tuning or learning.
4. Practice feedback should explain the next physical action, not merely mark
   an answer wrong.
5. Beginner material stays bite-sized and links directly to a playable drill.
6. Progress supports the player; it should not punish missed days or create
   streak guilt.
7. New third-party content needs an explicit compatible license and attribution.
8. Features observed in copyleft or proprietary apps are reimplemented from
   requirements and public behavior, never copied from their code or assets.

## Next high-value work

- User-created 1–12 string tunings stored locally, without an account.
- Guided tuning that can move to the next string after a stable confirmation.
- A short pitch-history trace and optional high-contrast stage view.
- Haptic confirmation with a setting and accessibility-safe fallback.
- Original/public-domain practice pieces with explicit provenance instead of
  expanding the commercial-song reference list.
- Device-recorded noise and low-frequency fixtures for regression tests.
