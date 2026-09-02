# StandardTune product status and next work

A survey of the app as it stands, and where the value is. Written from a
read of the whole source tree, so everything here is grounded in what the
code actually does rather than what the tabs imply.

The app has one genuinely strong asset: a native pitch-detection pipeline
wired to a hardened matcher that can tell whether you played the right
thing. The tuner, lesson drills, song practice and Chord Changes now share
that foundation. The remaining high-value work is expanding the instrument
content without weakening the free, private, offline-first product.

## Where the app is thin

| Area | State |
|---|---|
| Games tab | **8 playable tools**: Chord Quiz, Chord Changes, microphone-scored Scale Sprint and Speed Challenge, Ear Training, Rhythm Master, Fretboard Explorer and a local Progression Builder. |
| Play-along drills | **11 drills for 11 lessons.** Every lesson that can support a drill has one: the holding, tuning-up and reading-diagrams lessons are at-your-own-pace reading, and Guitar Anatomy has its own interactive diagram instead. |
| Song practice | 15 original, two-pass chord-change exercises with live scoring and no copyrighted lyrics or transcriptions. |
| Practice tracking | Done. Time at the instrument is logged per day, shown against the goal, and drives a streak. The lifetime total is retained separately from the bounded daily history. |
| Lesson scores | Shown on the card when a drill produced them. |
| Tuner | 36 presets across guitar, bass, ukulele, folk and orchestral strings; custom tunings; chromatic, needle, strobe and stage modes; room profiles; diagnostics; harmonic correction and calibration. |
| Bass | The tuner supports 4/5/6-string bass and Learn includes a four-part bass foundation path. Physical-device B0/E1 validation and microphone-scored bass drills remain release gates. |

## Worth building, in order

### 1. Local custom tunings — implemented

Let players build and name 1–12 string tunings entirely on-device. This is the
most natural extension of the free-tuner promise: alternate and personal
tunings should not require payment or an account. The editor needs bounded note
validation, safe persistence, deletion confirmation, and a clear choice of
instrument profile so low strings receive the right detector settings.

**Effort:** medium. **Value:** high — it removes the largest remaining tuner
feature gap without expanding permissions or licensing exposure.

### 2. Bass learning content — foundation implemented

The tuner now has dedicated bass profiles, variable string counts, low-range
DSP settings and reference tones through B0. Bass is intentionally still not
an onboarding answer because the lesson, chord and game catalog is written for
six-string guitar.

The remaining work is a bass-specific curriculum: four-line tab, fretboard
positions, rhythm/groove drills, bass anatomy and bass progress keys. It should
not reuse guitar chord diagrams or mark guitar lessons as bass-ready.

**Effort:** large. **Value:** medium — the tuner is ready, but learning content
needs its own product design and instrument-tested exercises.

## Smaller cleanups

All done: the dead 49-entry sample table, the unused lesson-navigation API,
and `getGuitarTypeStrings()` are deleted, and `getLessonScore()` is now
used rather than merely defined.

## Deliberately not doing

- **Song tabs and lyrics.** Which chords a song uses is a fact about the
  song. A bar-by-bar transcription or the lyrics are the copyrighted work
  itself. The song sheets stay a chord reference for that reason, and the
  fine print in the sheet says so.
- **Accounts, sync, analytics.** The privacy position — nothing recorded,
  nothing transmitted, no tracking — is a feature, and it is what the Play
  Data Safety declaration says. Anything that changes it has to change
  `PRIVACY.md` and the Data Safety form first.

## Recently done

For context on what has just landed, so this list is not re-proposing it:

- Chord diagrams draw barres as a single bar, and slide their window up
  the neck with a position label, so shapes above the fifth fret can be
  shown at all. Seven barre chords added (F#, Ab, Bb, Eb, F#m, G#m, C#m).
- The strumming drill runs to a click track with a count-in and grades
  each strum against the beat, on a shared drift-corrected clock that
  resyncs rather than firing missed beats in a burst.
- Chords play when tapped, and can be favourited.
- The tuning chosen in Settings actually reaches the Tuner.
- Songs list the chords they need, with diagrams you can hear, and provide
  original two-pass chord-change practice with live pitch scoring.
- **Chord Quiz**, the Games tab's first real game. Three question types —
  name the shape, pick the shape, name what you hear — over ten questions,
  with a streak bonus and a persisted high score. The work that mattered
  was the wrong answers: four chords drawn at random are trivial, so
  distractors are chosen from the same root and the most hand-similar
  shapes. Asking someone to identify G7 next to G, B7 and Cmaj7 is a real
  question; next to Bdim it is not. The remaining cards have since been
  replaced with playable local practice tools rather than placeholder alerts.
- A drill for every lesson that can have one. Seven new ones, written to
  the exercise each lesson already prescribes rather than invented: the
  barre drill runs in full-chord mode because the point is whether every
  string rings, the fingerpicking drill is the lesson's own p-i-m-a-m-i at
  the 50 BPM it asks for, and the scale drills are checked by tests that
  assert the notes really spell C major and A minor pentatonic.
- Practice tracking that exists. The tuner listening, the metronome
  running and a drill in progress all count time against today; the
  Lessons screen and Settings show it against the goal, and a streak that
  has lapsed reads as zero rather than flattering you with a stale number.
  The date arithmetic is a pure module with tests over local-midnight
  boundaries, daylight saving, leap day, and a clock that goes backwards.
- The gear on the Lessons screen opened the questionnaire and wiped your
  answers on one stray tap. It opens Settings now, and the labelled
  Retake button in Settings asks first.
- **Chord Changes**: the one-minute-changes exercise, which is the single
  most useful thing a beginner can drill, because the hard part of chords
  was never holding one. Pick two chords, play for a minute, and it counts
  the changes off the live pitch stream. It defaults to full-chord
  detection so a muted change does not score, and keeps a best per pair.
  A song's sheet has a "Drill G ↔ D" button that opens it prefilled with
  the two chords that song opens on.
- Dead code removed (a 49-entry sample table nothing imported, an unused
  lesson-navigation API, an unused tuning helper), lesson scores shown
  where they were previously stored and discarded, and Bass removed from
  the guitar-learning questionnaire. Bass tuning is now selected separately
  in the multi-instrument tuner, without implying that lessons adapt to bass.
- Per-chord progress. Every judged attempt — a quiz answer, a drill target
  hit or missed, a change that landed — is recorded against that chord, and
  the chord sheet says whether it is solid, shaky, or not practised yet. A
  "Needs work" filter collects the ones under 75%. Merely looking at a
  diagram does not count, or every chord you browsed would read as
  mastered, and fewer than four attempts reads as "learning" rather than
  convicting you on one bad guess.
- An audit pass for errors and holes: the tuner used to swallow mic errors
  (a denied permission left the main button silently dead), nothing
  released the mic when you left a screen, and Chord Quiz served silent
  listening questions when sounds were off. Favourites, longest streak,
  total practice time and song genre were all stored and never shown.
- 240 unit tests over tuner DSP and matching, chord and song data, timing,
  progress persistence, lesson drills, release notes and quiz generation,
  running in CI.
