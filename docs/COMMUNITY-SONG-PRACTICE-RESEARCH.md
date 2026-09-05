# Song practice community research

Checked 2026-09-03. This note records the product evidence behind StandardTune's
song-practice design; it is not a license inventory for third-party music.

## What players consistently ask for

- **A complete path instead of a pile of tools.** Beginners report being
  overwhelmed and want the app to decide what to practise next. They also want
  to play music from a preferred genre early, not finish a long theory course
  first.
- **Feedback that explains the fix.** A red miss is not enough. Players need to
  know whether to slow down, isolate a change, mute idle strings, move closer to
  the fret, or rehearse the rhythm without pitches.
- **Forgiving microphone scoring.** Players value immediate note/chord feedback,
  but rhythm detection becomes frustrating when latency, background sound, or a
  phone speaker is graded as a player mistake.
- **Practice controls should be free fundamentals.** Auto-scroll, section loops,
  speed control, transposition, capo support, saved songs, and setlists are the
  controls people expect once an app claims to teach songs.
- **The tuner must remain immediate.** Long loading, sales prompts, accounts and
  unrelated content placed in front of tuning are recurring complaints.
- **Community corrections need provenance and moderation.** A useful chart can
  benefit from player notes, but an unreviewed crowd transcription can also be
  wrong. StandardTune therefore saves a contribution locally and opens a
  prefilled public GitHub issue for maintainer review; it never publishes or
  uploads it silently. The OS share sheet remains available as an alternative.

## Decisions applied in the app

1. Tuner remains the first tab and is not blocked by song onboarding.
2. Playable CC0 exercises are labeled as exercises and kept separate from the
   song references. They use common progressions, scales, and mechanical
   technique patterns rather than invented titles that could be mistaken for
   real songs. Existing well-known song entries remain chord references only.
3. Wait mode follows the player; Flow mode keeps time. The guide track is a
   separate listen-only mode so phone audio cannot earn microphone hits.
4. Every full arrangement has section selection, four speed levels, a moving
   chart, beat highlighting, transpose/capo planning, saved settings, favorites,
   a local setlist, and actionable score feedback.
5. Community chart notes require an explicit submit action, enter a public
   review queue, and disclose that no automatic upload occurs.

## Sources

- GuitarTuna's current Google Play listing describes synchronized tabs,
  difficulty choices, tutorials, personalized feedback, chord games, 100+
  tunings and its instrument coverage:
  https://play.google.com/store/apps/details?id=com.ovelin.guitartuna&hl=en_US
- GuitarTuna App Store reviews praise Smart Scroll and request setlists, saved
  transpositions, sorting, and community chord corrections:
  https://apps.apple.com/au/app/guitartuna-tune-play-guitar/id527588389?platform=ipad&see-all=reviews
- Other GuitarTuna reviews repeatedly object to tuner paywalls, subscriptions,
  startup delays, promotional popups and tracking:
  https://apps.apple.com/us/app/guitartuna-tune-play-guitar/id527588389?see-all=reviews
- A 2025 guitar-learning discussion asks for interactive feedback, favorite
  genres immediately, motivation, and a coherent system rather than having to
  assemble one independently:
  https://www.reddit.com/r/guitarlessons/comments/1omd8bi/which_app_is_great_for_learning_to_play_the_guitar/
- Another learner discussion describes real-time feedback and adaptation as
  motivating, while warning that automated systems do not replace early posture
  and technique correction:
  https://www.reddit.com/r/guitarlessons/comments/17xs3lf/whats_the_best_app_for_seriously_learning_guitar/
- React Native 0.86 documents `Share.share({ message })` as the supported native
  share dialog used for explicit chart-note export:
  https://reactnative.dev/docs/0.86/share
- React Native documents HTTPS URLs as supported by `Linking.openURL`, and
  GitHub documents `title` and `body` URL parameters for prefilled issues:
  https://reactnative.dev/docs/linking
  https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue
- Expo Audio documents the playback/session APIs already used by the app. The
  guide remains separate from microphone scoring to avoid acoustic feedback:
  https://docs.expo.dev/versions/latest/sdk/audio/
