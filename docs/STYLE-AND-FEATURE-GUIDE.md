# StandardTune style and feature guide

Updated 2026-09-02 from the current StandardTune source and store artwork,
GuitarTuna's public website and Google Play listing, public Play reviews, guitar
community discussions, and permissively accessible/open-source tuner projects.

This is an inspiration guide, not a request to copy GuitarTuna's brand, artwork,
screen layouts, wording, song catalog, or proprietary teaching content.

## Product position

**StandardTune is the calm, trustworthy alternative:** accurate tuning and useful
practice tools that open quickly, work offline, respect the player, and remain
free, ad-free, account-free, and open source.

The one-line promise should be:

> Tune accurately. Practise with your real instrument. No ads, accounts, or
> paywalls.

This is a stronger point of difference than trying to match a commercial app's
song-catalog size. GuitarTuna's breadth attracts users, but its public reviews
show that interruptions, subscription pressure, gated alternate tunings, and
unwanted post-tuning flows are also its largest sources of frustration.

## What GuitarTuna does well

### Visual presentation

Its current public screens and store artwork consistently use:

- A nearly black background with one bright accent and very high contrast.
- A large, realistic headstock as the tuner screen's visual anchor.
- One obvious action or result in the center of the screen.
- Short outcome-led headlines with one highlighted phrase.
- Large type, limited copy, rounded controls, and generous spacing.
- Color-coded tool families, while keeping the tuner visually quiet.
- Feature screenshots that tell a sequence: all-in-one value, fast tuning,
  instruments/tunings, songs, teaching, practice tools, then skill-level choice.
- Beginner language such as choosing a current level instead of exposing
  technical settings first.

### Product structure

The current Play listing promotes 15 instrument tuners, 100+ tunings, custom and
chromatic tuning, songs, video/tutorial learning, personalized feedback, chord
games, ear training, a chord library, metronome, and left-hand mode. The useful
pattern is not the raw feature count; it is the path from **tune → learn →
practise → play**.

StandardTune already covers much of that path with 31 presets, guided and
chromatic tuning, live-scored lesson drills, chord audio, song exercises, Chord
Quiz, Chord Changes, and the metronome. Those capabilities should be surfaced as
one coherent journey rather than six equal destinations competing for attention.

## What reviews and communities ask for

These are recurring themes, not a statistically representative survey.

### Strong positive signals

- Fast, dependable tuning is the reason people install and keep a tuner.
- Clear flat/sharp or tune-up/tune-down direction matters more than decoration.
- A large readable meter is valued, especially on stage or by older players.
- Reliable bass and low-B detection is memorable because many tuners fail there.
- Chord diagrams, ear training, transition practice, a metronome, and short
  beginner lessons are appreciated when they remain optional.
- Broad preset coverage and alternate/custom tunings make experimentation easy.
- Guided and automatic modes help beginners; chromatic/manual detail helps
  experienced players.

### Strong negative signals

- Do not put pop-ups, trials, ads, login, or instrument questionnaires between
  launch and the tuner.
- Do not automatically open a song or lesson after tuning.
- Do not paywall alternate or custom tunings in a tuner positioned as free.
- Do not hide cents or make a broad range look exactly in tune for cosmetic
  smoothness. Honest readings build trust.
- Do not require a network connection for core tuning or downloaded/local
  practice.
- Do not publish unverified tabs or exercises without a visible correction path.
- Do not let a teaching layer incorrectly reward missed notes or reject correct
  playing without explaining why.
- Avoid crowded navigation and “app nonsense”; many players explicitly want a
  bare, immediate tool.

### StandardTune response

Keep the tuner as the unconditional startup screen. Remember the last tuning and
mode. Never redirect when a session completes. Put learning invitations below
the result or in their own area, never over the tuner. Every scored exercise
should offer a short reason for a miss—wrong pitch, incomplete chord, weak
signal, unstable input, or timing—using only local processing.

## StandardTune visual language

The direction is **quiet workshop instrument**, not neon gaming dashboard.
Retain the current navy identity and green success color so the result is
recognizably StandardTune rather than a GuitarTuna clone.

### Core palette

| Token | Value | Use |
|---|---:|---|
| Canvas | `#0F0F23` | Full-screen background |
| Surface | `#1A1A2E` | Cards and inactive controls |
| Raised surface | `#252545` | Selected rows, sheets, large controls |
| Border | `#2A2A4A` | Dividers and quiet outlines |
| Primary text | `#ECEDEE` | Titles and essential values |
| Secondary text | `#9CA3AF` | Explanations and metadata |
| Tune green | `#4CAF50` | In tune, completion, primary action |
| Near amber | `#FFC107` | Close, learning, caution |
| Off red | `#F44336` | Clearly off target or destructive action |

Green, amber, and red must always be paired with text, an icon, direction, or
shape. Color alone must never communicate tuning state.

### Type hierarchy

- Screen title: 28–32sp, bold, one line where possible.
- Primary live value: 52–72sp, regular or medium; reserve this scale for pitch,
  cents, BPM, score, or the current target.
- Section title: 20–24sp, bold.
- Card title: 16–18sp, semibold/bold.
- Body: 15–16sp.
- Supporting label: 12–14sp, never below 12sp for meaningful information.
- Tab labels: 11–12sp at normal scale; hide labels and preserve accessible names
  when the system font scale cannot fit them cleanly.

All layouts must remain operable at Android's 200% font setting. Prefer wrapping
and scrolling over shrinking meaningful text.

### Shape, spacing, and controls

- Use the existing 4/8/16/24/32/48 spacing rhythm.
- Cards: 16px radius; primary buttons: 12–24px radius depending on size.
- Interactive targets: at least 48×48dp.
- Keep one dominant action per screen. Secondary actions should not compete in
  saturation or size.
- Use bottom sheets for tuning/preset selection and short details; use full
  screens for lessons, games, and editors.
- Keep animation functional: 150–250ms transitions, a restrained in-tune pulse,
  and no continuous decorative movement outside an optional strobe meter.

### Tuner screen

- Preserve the centered instrument/headstock and six visible string targets.
- Make the current tuning name, instrument, A4 calibration, target note, cents,
  and direction form one clear reading order.
- Keep “Tap to Tune” or Stop fixed above navigation on short screens.
- A subtle fretboard/grid texture may be used behind the tuner at very low
  contrast; avoid photographic backgrounds that compete with the meter.
- When no trustworthy pitch is available, explain the signal state: too quiet,
  noisy room, unstable pitch, decaying note, or out of supported range.
- In selected-string mode, acknowledge corrected octave/overtone readings without
  turning diagnostics into alarming error messages.

### Learning and practice screens

- Lead with the next useful action, not a catalog wall.
- Show progress as “what to do next” plus a modest completion indicator.
- Keep targets large and visually connected to live feedback.
- After an exercise, show score, one useful observation, and two choices:
  **Try again** and **Continue**.
- Use positive language without awarding false success. “Good attack; the chord
  was missing its bass note” is more useful than a generic miss.

### Navigation direction

The current six-tab bar is feature-complete but crowded. A future structural pass
should test four top-level destinations:

1. **Tune** — tuner and tuning management.
2. **Learn** — lessons and recommended next activity.
3. **Practice** — song exercises, games, progress, and recent drills.
4. **Tools** — chord library, metronome, reference tones, and settings.

This is a medium-term information-architecture change, not a requirement for a
small patch. Deep links and existing progress keys must remain stable.

## Feature priorities

### Priority 0 — trust and daily usefulness

1. **Local custom tunings.** Create, name, edit, duplicate, reorder, and delete
   1–12-string tunings without an account. Validate pitch order and instrument
   range, and provide common starting templates.
2. **Quick Tune behavior.** Always open directly to the remembered tuner. Add an
   optional home-screen shortcut that starts listening in the saved preset.
3. **Transparent feedback.** Add a local “Why no reading?” panel with mic level,
   noise/stability status, practical fixes, and no raw-audio storage.
4. **Correction channel.** Add an easy Report content/problem action that opens a
   prefilled GitHub issue or email only after the user chooses to leave the app.
   Include app version and content ID, but never audio or personal data.
5. **Refresh Play screenshots.** The checked-in images predate current features,
   omit both playable games and live song practice, and still show the old long
   Metronome tab label.

### Priority 1 — features players repeatedly value

1. **Stage mode and optional strobe.** Fullscreen, high contrast, keep-screen-on,
   with both normal and strobe meters. Preserve an accessible text alternative.
2. **Left-handed diagrams.** Mirror chord/fretboard presentation consistently,
   including lesson and game assets.
3. **Ear Trainer.** Interval, note, and chord-quality rounds using existing local
   reference audio and the established scoring model.
4. **Fretboard Explorer.** Find notes by string/fret, then identify heard or shown
   notes. Reuse the live pitch matcher when the exercise calls for playing.
5. **Rhythm Trainer.** Read and perform short rhythm cells against the existing
   drift-corrected metronome clock.
6. **Local progression builder.** Let players assemble chord loops, choose tempo
   and strumming pattern, and practise them without copyrighted lyrics or tabs.

### Priority 2 — broaden carefully

- Bass-specific lessons, four-line tab, grooves, and progress—not relabeled
  guitar content.
- Validated presets/profiles for mandolin, banjo, violin-family instruments, and
  baritone ukulele, only after real-device and instrument testing.
- Spoken tune-up/down feedback, haptics, auto-advance, and a pitch-history option.
- Localization and international note names, including solfège.
- Export/import for custom tunings and local practice data.

### Deliberate non-goals

- Subscription mechanics, ads, forced trials, account gates, or analytics.
- A copied commercial song/tab catalog.
- Unlicensed lyrics or note-for-note copyrighted transcriptions.
- Social feeds, competitive dark patterns, or automatic post-tuning promotion.
- Adding an instrument name before its low range and overtone behavior are tested.

## Play Store picture guide

Use original StandardTune artwork and real app captures. Each portrait image
should communicate one outcome in five to eight words, with the important phrase
in green or amber. Do not place dense feature lists inside screenshots.

Recommended sequence:

1. **Tune accurately in seconds** — live tuner, large result, headstock.
2. **Guitar, bass, ukulele and more** — preset chooser plus instrument range.
3. **Steady in difficult rooms** — noise/stability guidance and overtone handling.
4. **Practise with your real guitar** — a microphone-scored lesson drill.
5. **Build cleaner chord changes** — Chord Changes result and improvement cue.
6. **Learn by sight and sound** — Chord Quiz and audible chord diagrams.
7. **Turn song chords into practice** — original two-pass song exercise.
8. **Free, offline and open source** — simple privacy/value card; no competitor
   logos and no unverifiable superlatives.

Screenshots should use a consistent device frame, background treatment, headline
position, and safe margins. Capture at least one bass preset and one accessibility
state. Avoid showing “Soon” cards in the store gallery.

## Acceptance checks for future work

- The tuner is usable within one tap of launch and never requires a network.
- No core action is hidden behind promotion, login, or a questionnaire.
- Guitar E2–E4, extended guitar low B, bass B0/E1, and ukulele ranges pass recorded
  fixture tests plus real-instrument checks.
- Background speech/music and harmonic-rich plucks do not create confident false
  success.
- All meaningful controls expose names, roles, values, and 48dp targets.
- Core flows work at 200% font scale and in a short 360×640dp window.
- A missed exercise target provides a useful reason when the engine knows one.
- New educational material is original, licensed compatibly, or purely factual.
- Store screenshots match the shipping UI and only advertise finished features.

## Research sources

- [GuitarTuna Google Play listing](https://play.google.com/store/apps/details?id=com.ovelin.guitartuna)
- [GuitarTuna online tuner and public product site](https://guitartuna.com/online-guitar-tuner)
- [GuitarTuna product/about page](https://guitartuna.com/about)
- [Public discussion: best guitar tuning app](https://www.reddit.com/r/Guitar/comments/1mjodfp/best_guitar_tuning_app/)
- [Public discussion: GuitarTuna and subscriptions](https://www.reddit.com/r/guitarlessons/comments/1ux3lhk/do_you_use_guitartuna_and_subscription/)
- [Public discussion: what players value in tuners](https://www.reddit.com/r/gear4music_official/comments/1t0t6m6/whats_the_best_guitar_tuner_youve_used/)
- [Public discussion: tuner-app recommendations](https://www.reddit.com/r/Guitar/comments/1urfupb/anyone_have_any_good_tuning_apps/)
- [GuitarTuner, MIT-licensed Android reference](https://github.com/SysAdminDoc/GuitarTuner)
- [Choona, GPL-3.0 Android/Wear OS reference](https://github.com/rohankhayech/Choona)

Open-source projects are references for behavior and validation ideas. Reuse of
code or assets must follow their individual licenses; visual identity and copy
should remain original to StandardTune.
